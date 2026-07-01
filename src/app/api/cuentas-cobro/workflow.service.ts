import { Types } from "mongoose";
import {
  CUENTA_COBRO_WORKFLOW_ACTION,
  type CuentaCobroWorkflowAction,
  inboxStatusesForRole,
} from "@/constants/cuentaCobroWorkflow";
import { USER_ROLES } from "@/constants/userRoles";
import { enrichContractWithPaymentStats } from "@/lib/contratos/contractStats";
import { connectDB } from "@/lib/db/mongoose";
import {
  canContractorSubmit,
  canDirectorApproveSend,
  canDirectorSign,
  canJefeApproveSend,
  canMarkPaid,
  canReturnToContractor,
  canSupervisorForwardDirector,
  canSupervisorSendCad,
  contractorMatchesReviewer,
  contractorQueryFilterForReviewer,
  hasWorkflowSignature,
  resolveStateAfterContractorSubmit,
  shouldHideFromSupervisorInbox,
} from "@/lib/cuentas-cobro/paymentAccountWorkflow";
import { isDevSendCadStateSkipped } from "@/lib/cuentas-cobro/devSendCadState";
import { isPaymentAccountSubmissionWindowOpen } from "@/lib/cuentas-cobro/paymentAccountAccess";
import { validatePaymentAccountReadiness } from "@/lib/cuentas-cobro/paymentAccountReadiness";
import { sendCadPackageEmail } from "@/lib/cuentas-cobro/sendCadPackageEmail";
import { sendWorkflowNotificationEmail } from "@/lib/cuentas-cobro/sendWorkflowNotificationEmail";
import logger from "@/lib/logger";
import {
  CuentaCobro,
  type CuentaCobroStatus,
  type ICuentaCobroDocument,
  toPublicCuentaCobro,
} from "@/models/cuentaCobro";
import {
  CuentaCobroActividad,
  toPublicCuentaCobroActividad,
} from "@/models/cuentaCobroActividad";
import {
  CUENTA_COBRO_DOCUMENT_SCOPE,
  CuentaCobroDocumento,
  toPublicCuentaCobroDocumento,
} from "@/models/cuentaCobroDocumento";
import {
  Contrato,
  getCurrentContractSnapshot,
  toPublicContrato,
} from "@/models/contrato";
import { User, type IUserDocument } from "@/models/user";
import type { UserRole } from "@/constants/userRoles";
import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "./cuentas-cobro.errors";

type WorkflowActor = {
  id: string;
  role: UserRole;
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
  signaturePath?: string | null;
};

function toWorkflowActor(user: IUserDocument): WorkflowActor {
  return {
    id: String(user._id),
    role: user.role,
    organizationalUnitId: user.organizationalUnitId ?? "",
    organizationalUnitType: user.organizationalUnitType ?? "",
    subareaId: user.subareaId ?? null,
    signaturePath: user.signaturePath ?? null,
  };
}

function toContractorSnapshot(user: IUserDocument) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    documentId: user.documentId,
    organizationalUnitName: user.organizationalUnitName ?? "",
    subareaName: user.subareaName ?? null,
    organizationalUnitId: user.organizationalUnitId ?? "",
    organizationalUnitType: user.organizationalUnitType ?? "",
    subareaId: user.subareaId ?? null,
  };
}

async function loadAccount(contractId: string, numero: number) {
  if (!Types.ObjectId.isValid(contractId)) {
    throw new PaymentAccountServiceError(
      "Cuenta de cobro no encontrada",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.PAYMENT_ACCOUNT_NOT_FOUND
    );
  }

  const account = await CuentaCobro.findOne({
    contratoId: contractId,
    numero,
  }).exec();

  if (!account) {
    throw new PaymentAccountServiceError(
      "Cuenta de cobro no encontrada",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.PAYMENT_ACCOUNT_NOT_FOUND
    );
  }

  return account;
}

async function loadContractor(userId: Types.ObjectId | string) {
  const contractor = await User.findById(userId).exec();
  if (!contractor) {
    throw new PaymentAccountServiceError(
      "Contratista no encontrado",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }
  return contractor;
}

function workflowActorLog(actor: WorkflowActor) {
  return {
    actorId: actor.id,
    actorRole: actor.role,
    organizationalUnitId: actor.organizationalUnitId,
    organizationalUnitType: actor.organizationalUnitType,
    subareaId: actor.subareaId ?? null,
    hasSignature: hasWorkflowSignature(actor),
  };
}

function assertSignature(actor: WorkflowActor) {
  if (!hasWorkflowSignature(actor)) {
    logger.warn("[cuentas-cobro/workflow] Firma requerida", workflowActorLog(actor));
    throw new PaymentAccountServiceError(
      "Debes subir tu firma en Perfil antes de continuar",
      400,
      PAYMENT_ACCOUNT_ERROR_CODES.SIGNATURE_REQUIRED
    );
  }
}

function pushDevolucion(
  account: ICuentaCobroDocument,
  actor: WorkflowActor,
  mensaje: string,
  estadoAnterior: CuentaCobroStatus,
  estadoNuevo: CuentaCobroStatus
) {
  account.devoluciones = account.devoluciones ?? [];
  account.devoluciones.push({
    deRol: actor.role,
    deUserId: new Types.ObjectId(actor.id),
    mensaje,
    fecha: new Date(),
    estadoAnterior,
    estadoNuevo,
  });
}

async function assertReviewerAccess(
  actor: WorkflowActor,
  account: ICuentaCobroDocument
) {
  const contractor = await loadContractor(account.userId);
  const contractorSnapshot = toContractorSnapshot(contractor);
  if (!contractorMatchesReviewer(contractorSnapshot, actor)) {
    logger.warn("[cuentas-cobro/workflow] Revisor sin permiso sobre la cuenta", {
      actor: workflowActorLog(actor),
      contractor: {
        id: contractorSnapshot.id,
        organizationalUnitId: contractorSnapshot.organizationalUnitId,
        organizationalUnitType: contractorSnapshot.organizationalUnitType,
        subareaId: contractorSnapshot.subareaId ?? null,
      },
      accountUserId: String(account.userId),
      accountNumero: account.numero,
    });
    throw new PaymentAccountServiceError(
      "No tienes permiso para gestionar esta cuenta",
      403,
      PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
    );
  }
  return contractor;
}

export const cuentasCobroWorkflowService = {
  async listForReviewer(actorInput: WorkflowActor) {
    await connectDB();
    const statuses = inboxStatusesForRole(actorInput.role);
    if (statuses.length === 0) {
      return { items: [] };
    }

    const contractors = await User.find({
      role: USER_ROLES.CONTRATISTA,
      ...contractorQueryFilterForReviewer(actorInput),
    })
      .select("_id name email documentId organizationalUnitName subareaName")
      .lean()
      .exec();

    const contractorIds = contractors.map((item) => item._id);
    if (contractorIds.length === 0) {
      return { items: [] };
    }

    const accounts = await CuentaCobro.find({
      userId: { $in: contractorIds },
      estado: { $in: statuses },
    })
      .sort({ updatedAt: -1 })
      .exec();

    const contractIds = [...new Set(accounts.map((item) => String(item.contratoId)))];
    const contracts = await Contrato.find({ _id: { $in: contractIds } }).exec();
    const contractMap = new Map(contracts.map((item) => [String(item._id), item]));
    const contractorMap = new Map(
      contractors.map((item) => [String(item._id), item])
    );

    const items = accounts
      .map((account) => {
        const contract = contractMap.get(String(account.contratoId));
        const contractor = contractorMap.get(String(account.userId));
        if (!contract || !contractor) return null;

        const contractorSnapshot = toContractorSnapshot(contractor);
        if (
          shouldHideFromSupervisorInbox(
            contractorSnapshot,
            account.estado as CuentaCobroStatus
          )
        ) {
          return null;
        }

        const publicContract = toPublicContrato(contract);
        const current = getCurrentContractSnapshot(contract);

        return {
          paymentAccount: toPublicCuentaCobro(account),
          contract: {
            id: publicContract.id,
            numeroContrato: current.numeroContrato ?? publicContract.numeroContrato,
            actual: publicContract.actual,
            objeto: publicContract.objeto,
          },
          contractor: {
            id: String(contractor._id),
            name: contractor.name,
            email: contractor.email,
            documentId: contractor.documentId,
            organizationalUnitName: contractor.organizationalUnitName ?? "",
            organizationalUnitId: contractor.organizationalUnitId ?? "",
            organizationalUnitType: contractor.organizationalUnitType ?? "",
            subareaId: contractor.subareaId ?? null,
            subareaName: contractor.subareaName ?? null,
          },
        };
      })
      .filter((item) => item !== null);

    return { items };
  },

  async getReviewDetail(
    actorInput: WorkflowActor,
    contractId: string,
    numero: number
  ) {
    await connectDB();
    const account = await loadAccount(contractId, numero);
    const contractor = await assertReviewerAccess(actorInput, account);

    const contract = await Contrato.findById(account.contratoId).exec();
    if (!contract) {
      throw new PaymentAccountServiceError(
        "Contrato no encontrado",
        404,
        PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const paymentAccounts = await CuentaCobro.find({
      userId: account.userId,
      contratoId: account.contratoId,
    })
      .sort({ numero: 1 })
      .exec();

    const [activitiesDoc, contractDocuments, accountDocuments] = await Promise.all([
      CuentaCobroActividad.findOne({
        contratoId: account.contratoId,
        numeroCuenta: account.numero,
      }).exec(),
      CuentaCobroDocumento.find({
        contratoId: account.contratoId,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
      })
        .sort({ tipoDocumento: 1 })
        .exec(),
      CuentaCobroDocumento.find({
        contratoId: account.contratoId,
        numeroCuenta: account.numero,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
      })
        .sort({ tipoDocumento: 1 })
        .exec(),
    ]);

    return {
      paymentAccount: toPublicCuentaCobro(account),
      contract: enrichContractWithPaymentStats(
        toPublicContrato(contract),
        paymentAccounts
      ),
      contractor: {
        id: String(contractor._id),
        name: contractor.name,
        email: contractor.email,
        documentId: contractor.documentId,
        organizationalUnitName: contractor.organizationalUnitName ?? "",
        organizationalUnitId: contractor.organizationalUnitId ?? "",
        organizationalUnitType: contractor.organizationalUnitType ?? "",
        subareaId: contractor.subareaId ?? null,
        subareaName: contractor.subareaName ?? null,
      },
      paymentAccounts: paymentAccounts.map(toPublicCuentaCobro),
      activities: activitiesDoc
        ? toPublicCuentaCobroActividad(activitiesDoc).actividades
        : [],
      contractDocuments: contractDocuments.map(toPublicCuentaCobroDocumento),
      accountDocuments: accountDocuments.map(toPublicCuentaCobroDocumento),
    };
  },

  async runAction(input: {
    actor: WorkflowActor;
    contractId: string;
    numero: number;
    action: CuentaCobroWorkflowAction;
    mensaje?: string;
  }) {
    const logContext = {
      contractId: input.contractId,
      numero: input.numero,
      action: input.action,
      actor: workflowActorLog(input.actor),
    };

    logger.info("[cuentas-cobro/workflow] Inicio acción", logContext);

    try {
      await connectDB();
      const account = await loadAccount(input.contractId, input.numero);
      const estadoAnterior = account.estado;
      let contractorForNotification: IUserDocument | null = null;
      let estadoParaNotificacion: CuentaCobroStatus | null = null;

      logger.info("[cuentas-cobro/workflow] Cuenta cargada", {
        ...logContext,
        estadoAnterior,
        accountUserId: String(account.userId),
        directorFirmadoAt: account.directorFirmadoAt ?? null,
      });

      switch (input.action) {
      case CUENTA_COBRO_WORKFLOW_ACTION.SUBMIT: {
        if (String(account.userId) !== input.actor.id) {
          throw new PaymentAccountServiceError(
            "Solo el contratista puede enviar la cuenta",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        if (!canContractorSubmit(account)) {
          throw new PaymentAccountServiceError(
            "La cuenta no está lista para enviarse",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        if (!isPaymentAccountSubmissionWindowOpen(toPublicCuentaCobro(account))) {
          throw new PaymentAccountServiceError(
            "La cuenta no está en ventana de envío",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        assertSignature(input.actor);

        const paymentAccounts = await CuentaCobro.find({
          userId: account.userId,
          contratoId: account.contratoId,
        })
          .sort({ numero: 1 })
          .exec();

        const [activitiesDoc, contractDocuments, accountDocuments] =
          await Promise.all([
            CuentaCobroActividad.findOne({
              contratoId: account.contratoId,
              numeroCuenta: account.numero,
            }).exec(),
            CuentaCobroDocumento.find({
              contratoId: account.contratoId,
              scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
            })
              .sort({ tipoDocumento: 1 })
              .exec(),
            CuentaCobroDocumento.find({
              contratoId: account.contratoId,
              numeroCuenta: account.numero,
              scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
            })
              .sort({ tipoDocumento: 1 })
              .exec(),
          ]);

        const readiness = validatePaymentAccountReadiness({
          paymentAccount: toPublicCuentaCobro(account),
          paymentAccounts: paymentAccounts.map(toPublicCuentaCobro),
          activitiesCount: activitiesDoc?.actividades?.length ?? 0,
          accountDocuments: accountDocuments.map(toPublicCuentaCobroDocumento),
          contractDocuments: contractDocuments.map(toPublicCuentaCobroDocumento),
          declarations: toPublicCuentaCobro(account).declaracionesJuradas,
          gfrFo11: toPublicCuentaCobro(account).gfrFo11,
        });

        if (!readiness.ready) {
          logger.warn("[cuentas-cobro/workflow] Cuenta no lista para envío", {
            ...logContext,
            readinessIssues: readiness.issues,
            readinessMessages: readiness.messages,
            missingContractDocuments: readiness.missingContractDocuments,
          });
          throw new PaymentAccountServiceError(
            readiness.messages[0] ?? "La cuenta no cumple los requisitos para enviarse",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }

        contractorForNotification = await loadContractor(account.userId);
        const contractorSnapshot = toContractorSnapshot(contractorForNotification);
        account.estado = resolveStateAfterContractorSubmit(
          contractorSnapshot,
          account
        );
        account.fechaEnvio = new Date();
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.FORWARD_DIRECTOR: {
        contractorForNotification = await assertReviewerAccess(input.actor, account);
        if (input.actor.role !== USER_ROLES.SUPERVISOR) {
          throw new PaymentAccountServiceError(
            "Solo el supervisor puede enviar al director",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        const contractorSnapshot = toContractorSnapshot(contractorForNotification);
        if (!canSupervisorForwardDirector(account, contractorSnapshot)) {
          throw new PaymentAccountServiceError(
            "La cuenta no puede enviarse al director en este estado",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        assertSignature(input.actor);
        account.estado = "PENDIENTE_DIRECTOR";
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.RETURN: {
        const mensaje = input.mensaje?.trim();
        if (!mensaje) {
          throw new PaymentAccountServiceError(
            "Debes indicar un mensaje para devolver la cuenta",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.RETURN_MESSAGE_REQUIRED
          );
        }
        if (!canReturnToContractor(account, input.actor.role)) {
          throw new PaymentAccountServiceError(
            "No puedes devolver la cuenta en este estado",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        if (
          input.actor.role === USER_ROLES.SUPERVISOR ||
          input.actor.role === USER_ROLES.JEFE ||
          input.actor.role === USER_ROLES.DIRECTOR
        ) {
          contractorForNotification = await assertReviewerAccess(input.actor, account);
        } else {
          throw new PaymentAccountServiceError(
            "No tienes permiso para devolver esta cuenta",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }

        pushDevolucion(account, input.actor, mensaje, estadoAnterior, "PENDIENTE_CONTRATISTA");
        account.estado = "PENDIENTE_CONTRATISTA";
        account.observaciones = mensaje;
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.DIRECTOR_SIGN: {
        contractorForNotification = await assertReviewerAccess(input.actor, account);
        if (input.actor.role !== USER_ROLES.DIRECTOR) {
          throw new PaymentAccountServiceError(
            "Solo el director puede firmar la cuenta",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        const contractorSnapshot = toContractorSnapshot(contractorForNotification);
        if (!canDirectorSign(account, contractorSnapshot)) {
          throw new PaymentAccountServiceError(
            "La cuenta no está pendiente de firma del director",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        assertSignature(input.actor);
        account.directorFirmadoAt = new Date();
        account.directorFirmadoPor = new Types.ObjectId(input.actor.id);
        account.estado = "PENDIENTE_ENVIO_CAD";
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.DIRECTOR_APPROVE_SEND: {
        contractorForNotification = await assertReviewerAccess(input.actor, account);
        if (input.actor.role !== USER_ROLES.DIRECTOR) {
          throw new PaymentAccountServiceError(
            "Solo el director puede firmar y enviar al CAD",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        const contractorSnapshot = toContractorSnapshot(contractorForNotification);
        if (!canDirectorApproveSend(account, contractorSnapshot)) {
          throw new PaymentAccountServiceError(
            "La cuenta no está pendiente de revisión del director",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        assertSignature(input.actor);
        if (isDevSendCadStateSkipped()) {
          estadoParaNotificacion = "ENVIADA_CAD";
        } else {
          account.directorFirmadoAt = new Date();
          account.directorFirmadoPor = new Types.ObjectId(input.actor.id);
          account.enviadaCadAt = new Date();
          account.enviadaCadPor = new Types.ObjectId(input.actor.id);
          account.estado = "ENVIADA_CAD";
        }
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.SEND_CAD: {
        contractorForNotification = await assertReviewerAccess(input.actor, account);
        if (input.actor.role !== USER_ROLES.SUPERVISOR) {
          throw new PaymentAccountServiceError(
            "Solo el supervisor puede enviar al CAD",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        const contractorSnapshot = toContractorSnapshot(contractorForNotification);
        if (!canSupervisorSendCad(account, contractorSnapshot)) {
          throw new PaymentAccountServiceError(
            "La cuenta requiere la firma del director antes de enviarse al CAD",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        assertSignature(input.actor);
        if (isDevSendCadStateSkipped()) {
          estadoParaNotificacion = "ENVIADA_CAD";
        } else {
          account.enviadaCadAt = new Date();
          account.enviadaCadPor = new Types.ObjectId(input.actor.id);
          account.estado = "ENVIADA_CAD";
        }
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.JEFE_APPROVE_SEND: {
        contractorForNotification = await assertReviewerAccess(input.actor, account);
        if (input.actor.role !== USER_ROLES.JEFE) {
          throw new PaymentAccountServiceError(
            "Solo el jefe puede aprobar y enviar al CAD",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        if (!canJefeApproveSend(account)) {
          throw new PaymentAccountServiceError(
            "La cuenta no está pendiente de revisión del jefe",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        assertSignature(input.actor);
        if (isDevSendCadStateSkipped()) {
          estadoParaNotificacion = "ENVIADA_CAD";
        } else {
          account.jefeFirmadoAt = new Date();
          account.jefeFirmadoPor = new Types.ObjectId(input.actor.id);
          account.enviadaCadAt = new Date();
          account.enviadaCadPor = new Types.ObjectId(input.actor.id);
          account.estado = "ENVIADA_CAD";
        }
        break;
      }

      case CUENTA_COBRO_WORKFLOW_ACTION.MARK_PAID: {
        contractorForNotification = await assertReviewerAccess(input.actor, account);
        if (input.actor.role !== USER_ROLES.SUPERVISOR) {
          throw new PaymentAccountServiceError(
            "Solo el supervisor puede marcar la cuenta como pagada",
            403,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_FORBIDDEN
          );
        }
        if (!canMarkPaid(account)) {
          throw new PaymentAccountServiceError(
            "La cuenta debe estar enviada al CAD para marcarla como pagada",
            400,
            PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
          );
        }
        account.estado = "APROBADA";
        account.fechaPago = new Date();
        break;
      }

      default:
        throw new PaymentAccountServiceError(
          "Acción de flujo no válida",
          400,
          PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
        );
    }

      await account.save();

      logger.info("[cuentas-cobro/workflow] Acción completada", {
        ...logContext,
        estadoAnterior,
        estadoNuevo: account.estado,
        estadoParaNotificacion: estadoParaNotificacion ?? null,
      });

      if (contractorForNotification) {
      const contract = await Contrato.findById(input.contractId)
        .select("numeroContrato")
        .exec();
      const contractorSnapshot = toContractorSnapshot(contractorForNotification);
      const estadoNotificacion = estadoParaNotificacion ?? account.estado;
      const isCadDelivery =
        estadoNotificacion === "ENVIADA_CAD" || account.estado === "ENVIADA_CAD";

      if (isCadDelivery) {
        void sendCadPackageEmail({
          userId: String(account.userId),
          contractId: input.contractId,
          accountNumber: account.numero,
        }).catch((error) => {
          logger.error("[cuentas-cobro/workflow] envío CAD", {
            message: error instanceof Error ? error.message : String(error),
          });
        });
      } else {
        void sendWorkflowNotificationEmail({
          contractId: input.contractId,
          accountNumber: account.numero,
          contractNumber: contract?.numeroContrato ?? input.contractId,
          estadoNuevo: estadoNotificacion,
          contractor: {
            name: contractorSnapshot.name,
            email: contractorSnapshot.email,
            organizationalUnitId: contractorSnapshot.organizationalUnitId,
            organizationalUnitType: contractorSnapshot.organizationalUnitType,
            subareaId: contractorSnapshot.subareaId,
          },
          mensaje: input.mensaje,
        }).catch((error) => {
          logger.error("[cuentas-cobro/workflow] notificación", {
            message: error instanceof Error ? error.message : String(error),
          });
        });
      }
      }

      return { paymentAccount: toPublicCuentaCobro(account) };
    } catch (error) {
      if (error instanceof PaymentAccountServiceError) {
        logger.warn("[cuentas-cobro/workflow] Acción rechazada", {
          ...logContext,
          message: error.message,
          statusCode: error.statusCode,
          code: error.code,
        });
      } else {
        logger.error("[cuentas-cobro/workflow] Error inesperado", {
          ...logContext,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      throw error;
    }
  },

  toWorkflowActor,
};

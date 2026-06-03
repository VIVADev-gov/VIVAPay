import { NextResponse } from "next/server";
import logger from './logger';


export function errorResponse(
    message: string,
    statusCode: number = 500,
    code?: string
) {
    return NextResponse.json(
        { success: false, message, ...(code ? { code } : {}) },
        {
            status: statusCode,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );
}

export function successResponse(
    message: string = "Operación exitosa",
    data: unknown = {},
    statusCode: number = 200
) {
    return NextResponse.json(
        { success: true, message, data }, 
        { 
            status: statusCode,
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        }
    );
}

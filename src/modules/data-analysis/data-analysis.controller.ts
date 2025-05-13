import { Request, Response } from 'express';

export const getDataAnalysis = (req: Request, res:Response)=>{
    res.status(200).json({"message": "Hello World"})
}
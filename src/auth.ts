import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import { getDB } from './db/mongo';
import { ObjectId } from 'mongodb';
import { COLLECTION_TRAINERS } from './utils';

dotenv.config();

const SUPER_SECRET = process.env.SECRET 

type TokenPayload = {
    userId: string;
}

export const signToken = (userId: string) => {
    return jwt.sign({ userId }, SUPER_SECRET!, { expiresIn: "1h" });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        if(!SUPER_SECRET) throw new Error("SECRET is not defined in environment variables");
        return jwt.verify(token, SUPER_SECRET) as TokenPayload;
    } catch (err) {
        return null;
    }
};

export const getUserFromToken = async (token: string) => {
    const payload = verifyToken(token);
    if(!payload) return null;
    const db = getDB();
    return await db.collection(COLLECTION_TRAINERS).findOne({
        _id: new ObjectId(payload.userId)
    });
};
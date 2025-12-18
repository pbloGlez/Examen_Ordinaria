import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client: MongoClient;
let dB: Db;
const dbName = "Examen_Ordinaria";

export const connectToMongoDB = async () => {
    try{
        const mongoUrl = process.env.MONGO_URL;
        if(mongoUrl){
            client = new MongoClient(mongoUrl);
            await client.connect();
            dB = client.db(dbName);
            console.log("Estás conectado a mongo chulo");
        }else{
            throw new Error ("La URL de mongo está mal campeón");
        }
    }
    catch(err){
        console.log("Error de mongo: ",err)
    }
};

export const getDB = ():Db => dB;
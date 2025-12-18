import { ApolloServer } from "apollo-server";
import { connectToMongoDB } from "./db/mongo"
import { getUserFromToken } from "./auth";
import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/schema";




const start = async () => {
    await connectToMongoDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async ({ req }) => {
            const token = req.headers.authorization || "";
            console.log(token)
            //condicion ? valor_si_true : valor_si_false
            const user = token ? await getUserFromToken (token as string) : null;
            return user;
        },
    });

    await server.listen({port: 4004});
    console.log("GQL funcionando en el puerto 4004");
};

start().catch(err => console.error(err));
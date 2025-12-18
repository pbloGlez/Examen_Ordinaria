import { IResolvers } from "@graphql-tools/utils";
import { signToken } from "../auth";
import { getPokemonById, getPokemons, createPokemon, catchPokemon, freePokemon } from "../collections/pokemonCollection";
import { createUser, validateUser } from "../collections/userCollection";
import { getDB } from "../db/mongo";
import { ObjectId } from "mongodb";

export const resolvers: IResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return user;  
    },

    pokemons: async (_, { page, size }) => {
      return await getPokemons(page || 1, size || 10);
    },
    
    pokemon: async (_, { id }) => {
      return await getPokemonById(id);
    },
  },

  Mutation: {
    createPokemon: async (_, { name, description, height, weight, types }, { user }) => {
      if (!user) throw new Error("Authentication required");
      return await createPokemon(name, description, height, weight, types);
    },

    catchPokemon: async (_, { pokemonId, nickname }, { user }) => {
      if (!user) throw new Error("You must be logged in");
      return await catchPokemon(pokemonId, user._id.toString(), nickname);
    },

    freePokemon: async (_, { ownedPokemonId }, { user }) => {
      if (!user) throw new Error("You must be logged in");
      return await freePokemon(ownedPokemonId, user._id.toString());
    },

    startJourney: async (_, { name, password }) => {
      const userId = await createUser(name, password);
      return signToken(userId);
    },

    login: async (_, { name, password }) => {
      const user = await validateUser(name, password);
      if (!user) throw new Error("Invalid credentials");
      return signToken(user._id.toString());
    },
  },

  Trainer: {
    pokemons: async (parent) => {
      if (!parent.pokemons || parent.pokemons.length === 0) return [];
      
      const db = getDB();
      const objectIds = parent.pokemons.map((id: string) => new ObjectId(id));
      
      const ownedPokemons = await db.collection("owned_pokemons")
        .find({ _id: { $in: objectIds } })
        .toArray();
      
      return ownedPokemons.map(p => ({
        _id: p._id.toString(),
        pokemonId: p.pokemonId.toString(),  
        nickname: p.nickname,
        attack: p.attack,
        defense: p.defense,
        speed: p.speed,
        special: p.special,
        level: p.level
      }));
    }
  },

  OwnedPokemon: {
    pokemon: async (parent) => {
      return await getPokemonById(parent.pokemonId);
    }
  }
};
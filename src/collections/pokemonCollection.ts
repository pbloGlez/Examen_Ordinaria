import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo";
import { COLLECTION_TRAINERS, COLLECTION_POKEMONS, COLLECTION_OWNED_POKEMONS } from "../utils";
import { PokemonType } from "../types";

export const getPokemons = async (page: number = 1, size: number = 10) => {
  const db = getDB();
  return await db.collection(COLLECTION_POKEMONS)
    .find()
    .skip((page - 1) * size)
    .limit(size)
    .toArray();
};

export const getPokemonById = async (id: string) => {
  const db = getDB();
  const pokemon = await db.collection(COLLECTION_POKEMONS)
    .findOne({ _id: new ObjectId(id) });
  return pokemon ? { ...pokemon, _id: pokemon._id.toString() } : null;
};

export const createPokemon = async (name: string, description: string, height: number, weight: number,  types: PokemonType[]) => {
  const db = getDB();
  const validTypes = ["NORMAL", "FIRE", "WATER", "ELECTRIC", "GRASS", "ICE", "FIGHTING", "POISON", "GROUND", "FLYING", "PSYCHIC", "BUG", "ROCK", "GHOST", "DRAGON"];
  
  const invalidType = types.find(t => !validTypes.includes(t));
  if (invalidType) throw new Error(`Invalid Pokémon type: ${invalidType}`);
  
  const result = await db.collection(COLLECTION_POKEMONS).insertOne({
    name,
    description,
    height,    
    weight,    
    types,
    createdAt: new Date().toISOString()
  });
  
  return await getPokemonById(result.insertedId.toString());
};

export const catchPokemon = async (pokemonId: string, trainerId: string, nickname?: string) => {
  const db = getDB();
  const localTrainerId = new ObjectId(trainerId);
  const localPokemonId = new ObjectId(pokemonId);
  
  const pokemon = await getPokemonById(pokemonId);
  if (!pokemon) throw new Error("Pokémon not found");
  
  const trainer = await db.collection(COLLECTION_TRAINERS)
    .findOne({ _id: localTrainerId });
  if (!trainer) throw new Error("Trainer not found");
  
  if (trainer.pokemons && trainer.pokemons.length >= 6) {
    throw new Error("Cannot have more than 6 Pokémon");
  }
  
  const ownedPokemonId = new ObjectId();
  
  const ownedPokemon = {
    _id: ownedPokemonId,
    pokemonId: localPokemonId,
    trainerId: localTrainerId,
    nickname: nickname,
    level: 1,
    attack: Math.floor(Math.random() * 100) + 1,
    defense: Math.floor(Math.random() * 100) + 1,
    speed: Math.floor(Math.random() * 100) + 1,
    special: Math.floor(Math.random() * 100) + 1,
    capturedAt: new Date().toISOString()
  };
  
  await db.collection(COLLECTION_OWNED_POKEMONS).insertOne(ownedPokemon);
  
  await db.collection(COLLECTION_TRAINERS).updateOne(
    { _id: localTrainerId },
    { $addToSet: { pokemons: ownedPokemonId } }
  );
  
  return {
    _id: ownedPokemonId.toString(),
    pokemonId: pokemonId,  
    nickname: nickname,
    attack: ownedPokemon.attack,
    defense: ownedPokemon.defense,
    speed: ownedPokemon.speed,
    special: ownedPokemon.special,
    level: 1
  };
};


export const freePokemon = async (ownedPokemonId: string, trainerId: string) => {
  const db = getDB();
  const localTrainerId = new ObjectId(trainerId);
  const localOwnedPokemonId = new ObjectId(ownedPokemonId);
  
  const trainer = await db.collection(COLLECTION_TRAINERS).findOne({
    _id: localTrainerId,
    pokemons: localOwnedPokemonId
  });
  if (!trainer) throw new Error("Trainer not found or doesn't own this Pokémon");
  
  await db.collection(COLLECTION_OWNED_POKEMONS).deleteOne({
    _id: localOwnedPokemonId
  });
  
  await db.collection(COLLECTION_TRAINERS).updateOne(
    { _id: localTrainerId },
    { $addToSet: { pokemons: localOwnedPokemonId } }
  );
  
  const updatedTrainer = await db.collection(COLLECTION_TRAINERS)
    .findOne({ _id: localTrainerId });
  
  if (!updatedTrainer) throw new Error("Error updating trainer");
  
  return {
    _id: updatedTrainer._id.toString(),
    name: updatedTrainer.name || "Trainer",
    pokemons: updatedTrainer.pokemons || []
  };
};

export const getOwnedPokemonByIds = async (ids: string[]) => {
  const db = getDB();
  
  if (!ids || ids.length === 0) return [];
  
  const objectIds = ids.map(id => new ObjectId(id));
  const ownedPokemons = await db.collection(COLLECTION_OWNED_POKEMONS)
    .find({ _id: { $in: objectIds } })
    .toArray();
  
  return ownedPokemons.map(p => ({
    ...p,
    _id: p._id.toString(),
    pokemonId: p.pokemonId.toString(),
    trainerId: p.trainerId.toString()
  }));
};
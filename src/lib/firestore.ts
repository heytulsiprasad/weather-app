
import { firestore } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
} from "firebase/firestore";

export interface Favorite {
  id: string;
  city: string;
  country: string;
}

const localStorageKey = (userId: string) => `skysnap:favorites:${userId}`;

const readLocalFavorites = (userId: string): Favorite[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(localStorageKey(userId));
    return stored ? (JSON.parse(stored) as Favorite[]) : [];
  } catch {
    return [];
  }
};

const writeLocalFavorites = (userId: string, favorites: Favorite[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      localStorageKey(userId),
      JSON.stringify(favorites)
    );
  } catch {
    // Swallow storage errors silently; the app can continue without persistence.
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export const addFavorite = async (
  userId: string,
  city: string,
  country: string
) => {
  if (!firestore) {
    const newFavorite: Favorite = {
      id: generateId(),
      city,
      country,
    };
    const existing = readLocalFavorites(userId);
    writeLocalFavorites(userId, [...existing, newFavorite]);
    return newFavorite;
  }

  const db = firestore;
  const favorite: Omit<Favorite, "id"> = { city, country };
  const docRef = doc(collection(db, `users/${userId}/favorites`));
  await setDoc(docRef, favorite);
  return { id: docRef.id, ...favorite };
};

export const getFavorites = async (userId: string): Promise<Favorite[]> => {
  if (!firestore) {
    return readLocalFavorites(userId);
  }

  const db = firestore;
  const q = query(collection(db, `users/${userId}/favorites`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Favorite)
  );
};

export const removeFavorite = async (userId: string, favoriteId: string) => {
  if (!firestore) {
    const existing = readLocalFavorites(userId);
    const filtered = existing.filter((favorite) => favorite.id !== favoriteId);
    writeLocalFavorites(userId, filtered);
    return;
  }

  const db = firestore;
  await deleteDoc(doc(db, `users/${userId}/favorites`, favoriteId));
};

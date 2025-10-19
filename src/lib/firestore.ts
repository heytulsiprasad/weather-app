
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

export const addFavorite = async (
  userId: string,
  city: string,
  country: string
) => {
  const favorite: Omit<Favorite, "id"> = { city, country };
  const docRef = doc(collection(firestore, `users/${userId}/favorites`));
  await setDoc(docRef, favorite);
  return { id: docRef.id, ...favorite };
};

export const getFavorites = async (userId: string): Promise<Favorite[]> => {
  const q = query(collection(firestore, `users/${userId}/favorites`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Favorite)
  );
};

export const removeFavorite = async (userId: string, favoriteId: string) => {
  await deleteDoc(doc(firestore, `users/${userId}/favorites`, favoriteId));
};

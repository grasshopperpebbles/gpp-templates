import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./client";

/**
 * Helper type for Firestore documents with ID
 */
export type WithId<T> = T & { id: string };

/**
 * Get a single document by ID
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<WithId<T> | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as WithId<T>;
}

/**
 * Get all documents from a collection
 */
export async function getDocuments<T extends DocumentData>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
): Promise<WithId<T>[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const querySnap = await getDocs(q);

  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WithId<T>[];
}

/**
 * Add a new document to a collection
 */
export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<DocumentReference> {
  const collectionRef = collection(db, collectionName);
  return addDoc(collectionRef, data);
}

/**
 * Update an existing document
 */
export async function updateDocument<T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return updateDoc(docRef, data);
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return deleteDoc(docRef);
}

// Re-export Firestore query helpers for convenience
export { collection, doc, query, where, orderBy, limit };

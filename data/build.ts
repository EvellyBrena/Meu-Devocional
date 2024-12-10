import { Database } from "bun:sqlite";

const olddb = new Database("biblia_harpa.sqlite", { readonly: true });
const contents = olddb.serialize();
const db = Database.deserialize(contents);


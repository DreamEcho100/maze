import { query } from "@solidjs/router";
import { getTranslationByLocal } from "./server/get-translation";

export const getTranslationByLocalQuery = query(getTranslationByLocal, "get-translation-by-local");

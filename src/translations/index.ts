import en from "./en";
import ta from "./ta";
import hi from "./hi";
import te from "./te";
import ml from "./ml";
import kn from "./kn";

export const translations = {
  en,
  ta,
  hi,
  te,
  ml,
  kn,
};

export type Language = keyof typeof translations;

import { useCallback, useEffect, useState } from "react";

const KEY = "gyaan-language";

export function useLanguage() {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) setLanguageState(stored);
  }, []);

  const setLanguage = useCallback((code: string) => {
    localStorage.setItem(KEY, code);
    setLanguageState(code);
  }, []);

  return { language, setLanguage };
}

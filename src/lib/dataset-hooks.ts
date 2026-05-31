import { useEffect, useState } from "react";
import { loadDataset, trainModel, type Model, type StudentRow } from "./dataset";

export function useDataset() {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDataset()
      .then((r) => {
        if (cancelled) return;
        setRows(r);
        try {
          setModel(trainModel(r));
        } catch (e) {
          setError(String(e));
        }
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, model, error, loading: !rows && !error };
}

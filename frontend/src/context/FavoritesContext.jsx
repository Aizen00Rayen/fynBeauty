import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds([]);
      return;
    }
    try {
      const { data } = await api.get("/users/favorites/ids");
      setIds(data);
    } catch {
      setIds([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((id) => ids.includes(id), [ids]);

  const toggleFavorite = useCallback(
    async (id) => {
      if (!user) return false;
      if (ids.includes(id)) {
        setIds((prev) => prev.filter((x) => x !== id));
        await api.delete(`/users/favorites/${id}`);
        return false;
      } else {
        setIds((prev) => [...prev, id]);
        await api.post(`/users/favorites/${id}`);
        return true;
      }
    },
    [ids, user]
  );

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite, toggleFavorite, refresh, count: ids.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

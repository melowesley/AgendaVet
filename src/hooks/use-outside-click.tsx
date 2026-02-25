import { useEffect, type RefObject } from "react";

/**
 * Hook para detectar cliques fora de um elemento.
 * Útil para fechar dropdowns, modais, sidebars e overlays ao clicar fora.
 *
 * @param ref - Ref do elemento que não deve disparar o callback ao ser clicado
 * @param callback - Função chamada quando o usuário clica fora do elemento
 */
export const useOutsideClick = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};

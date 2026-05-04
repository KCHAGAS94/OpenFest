// Ícones SVG para lápis (editar) e lixeira (deletar)
export function IconEdit({ size = 20, color = "#888" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.85 2.85a2.121 2.121 0 0 1 3 3l-9.5 9.5-4 1 1-4 9.5-9.5zM13 4l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconTrash({ size = 20, color = "#ef4444" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h14M8 9v4m4-4v4M5 6v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M7 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

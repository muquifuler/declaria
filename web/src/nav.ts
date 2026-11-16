// Enlaces del menú principal (el orden es el del menú)
export interface NavItem {
  to: string;
  label: string;
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Inicio' },
  { to: '/precios', label: 'Precios' },
  { to: '/contacto', label: 'Contacto' },
];

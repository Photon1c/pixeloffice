const rawPublic = import.meta.env.VITE_PUBLIC_MODE;
const rawLab = import.meta.env.VITE_LAB_MODE;

export const PUBLIC_MODE = rawPublic === 'true';
export const LAB_MODE = rawLab !== 'false';

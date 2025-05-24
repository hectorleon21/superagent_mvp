import { writable } from 'svelte/store';

export interface UserProfile {
  name: string;
  phone: string;
  profile: {
    name: string;
    img: string;
    desc: string;
  } | null;
}

export const selectedProfile = writable<UserProfile | null>(null); 
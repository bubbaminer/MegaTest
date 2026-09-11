/// <reference types="astro/client" />

import type { AuthContext } from '@/lib/auth/authorize';

declare global {
  namespace App {
    interface Locals {
      auth?: AuthContext;
    }
  }
}

export {};

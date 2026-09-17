import type { APIRoute } from 'astro';
import { AppError } from '@/lib/errors/app-error';
import { createGameSection } from '@/lib/catalog/admin';
export const POST:APIRoute=async({params,request,locals,redirect})=>{if(!locals.auth||!params.id)return redirect('/login',303);const form=await request.formData();try{await createGameSection(locals.auth.accessToken,params.id,String(form.get('type')??''),String(form.get('data')??''));return redirect(`/admin/catalog/games/${params.id}?sectionCreated=1`,303);}catch(error){const code=error instanceof AppError?error.code:'INTERNAL_ERROR';return redirect(`/admin/catalog/games/${params.id}?error=${code.toLowerCase()}`,303);}};

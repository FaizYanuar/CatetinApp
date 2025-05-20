import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 1. Define your public routes (sign-in and sign-up, including any nested paths)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// 2. Export the middleware, protecting everything except those public routes
export default clerkMiddleware(async (auth, req) => {
  // If the incoming request is NOT one of your public routes, enforce auth
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// 3. Tell Next.js which requests the middleware should run on
export const config = {
  matcher: [
    // Skip _next internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API & tRPC routes
    '/(api|trpc)(.*)',
  ],
};

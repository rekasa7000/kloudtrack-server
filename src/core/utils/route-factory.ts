import { Router } from "express";
// ***** DO NOT USE THIS YET
export const registerRoutes = (router: Router, controller: any, routes: RouteDef[]) => {
  routes.forEach(({ method, path, handler }) => {
    router[method](path, controller[handler]);
  });
};

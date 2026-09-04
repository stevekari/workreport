package com.steveForms.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    // Forward non-API, non-static GET routes to index.html for React SPA router
    @GetMapping(value = {
            "/{path:[^\\.]*}",
            "/*/{path:[^\\.]*}"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}


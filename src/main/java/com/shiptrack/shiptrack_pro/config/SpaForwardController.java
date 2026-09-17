package com.shiptrack.shiptrack_pro.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    /**
     * Forward any non-static, non-API single level or multi-level path to index.html
     * so React Router can handle client-side routing on page refresh.
     */
    @GetMapping(value = {"/{path:[^\\.]*}", "/*/{path:[^\\.]*}"})
    public String forward() {
        return "forward:/index.html";
    }
}

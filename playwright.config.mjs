import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:90000,expect:{timeout:15000},fullyParallel:false,workers:1,retries:1,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']}},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:900}}},{name:'mobile',use:{...devices['Pixel 7']}}],
 webServer:{command:'node scripts/dev.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:120000},
});

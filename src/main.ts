import { createApp, App as Application } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "@/style/common.scss";
import ElementPlus from "element-plus";
import elementI18nZhCn from "element-plus/es/locale/lang/zh-cn";
import elementI18nEn from "element-plus/es/locale/lang/en";

import i18n from "./i18n";
// import "@/style/element-reset.scss";
// import directive from "@/common/directive";
import EMQSelect from "@/components/EmqSelect.vue";

function globalComponents(app: Application) {
  app.component(EMQSelect.name, EMQSelect);
}

const elementLang = store.state.lang === "en" ? elementI18nEn : elementI18nZhCn;

createApp(App)
  .use(store)
  .use(router)
  .use(ElementPlus, {
    locale: elementLang,
  })
  .use(i18n)
  .use(globalComponents)
  .mount("#app");

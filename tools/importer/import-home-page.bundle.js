/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home-page.js
  var import_home_page_exports = {};
  __export(import_home_page_exports, {
    default: () => import_home_page_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const cellOf = (row) => row ? row.querySelector(":scope > div") || row : null;
    const hasText = (node) => !!(node && node.textContent.replace(/\s+/g, ""));
    let imageRow = null;
    let eyebrowRow = null;
    let textRow = null;
    let actionsRow = null;
    const content = element.querySelector(":scope > .hero-content");
    if (content) {
      imageRow = element.querySelector(":scope > .hero-background");
      const rows = [...content.children];
      actionsRow = rows.find((r) => r.classList.contains("hero-actions")) || null;
      const others = rows.filter((r) => r !== actionsRow);
      if (others.length >= 2) {
        [eyebrowRow, textRow] = others;
      } else if (others.length === 1) {
        const only = others[0];
        if (only.classList.contains("hero-text") || only.querySelector("h1, h2, h3, h4, h5, h6")) {
          textRow = only;
        } else {
          eyebrowRow = only;
        }
      }
    } else {
      const rows = [...element.children];
      if (rows.length >= 4) {
        [imageRow, eyebrowRow, textRow, actionsRow] = rows;
      } else {
        rows.forEach((row) => {
          const heading = row.querySelector("h1, h2, h3, h4, h5, h6");
          const text = row.textContent.replace(/\s+/g, "");
          const links2 = [...row.querySelectorAll("a")];
          if (row.querySelector("picture, img") && !heading && !imageRow) imageRow = row;
          else if (heading && !textRow) textRow = row;
          else if (links2.length && links2.map((a) => a.textContent).join("").replace(/\s+/g, "") === text && !actionsRow) actionsRow = row;
          else if (text && !eyebrowRow) eyebrowRow = row;
          else if (text && !textRow) textRow = row;
        });
      }
    }
    const cells = [];
    const imageCell = [];
    const srcImg = imageRow ? imageRow.querySelector("img") : null;
    if (srcImg && srcImg.getAttribute("src")) {
      const img = document2.createElement("img");
      img.src = srcImg.getAttribute("src").split("?")[0];
      img.alt = srcImg.getAttribute("alt") || "";
      imageCell.push(hint("image"), img);
    }
    cells.push([imageCell.length ? imageCell : ""]);
    const eyebrowCell = cellOf(eyebrowRow);
    if (hasText(eyebrowCell)) {
      const p = document2.createElement("p");
      p.textContent = eyebrowCell.textContent.trim();
      cells.push([[hint("eyebrow"), p]]);
    } else {
      cells.push([""]);
    }
    const textCell = cellOf(textRow);
    if (hasText(textCell) || textCell && textCell.querySelector("img, picture")) {
      cells.push([[hint("text"), ...textCell.childNodes]]);
    } else {
      cells.push([""]);
    }
    const links = actionsRow ? [...actionsRow.querySelectorAll("a[href]")] : [];
    const ctaCell = [];
    ["cta_link", "cta_linkTwo"].forEach((field, i) => {
      const src = links[i];
      if (!src) return;
      const a = document2.createElement("a");
      a.href = src.getAttribute("href");
      a.textContent = src.textContent.trim();
      const p = document2.createElement("p");
      p.append(a);
      ctaCell.push(hint(field), p);
    });
    cells.push([ctaCell.length ? ctaCell : ""]);
    if (!imageCell.length && !hasText(eyebrowCell) && !hasText(textCell) && !ctaCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/sravaneds-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var RUNTIME_ATTRS = [
    "data-block-status",
    "data-section-status",
    "data-block-name"
  ];
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header-wrapper",
        "header",
        "footer.footer-wrapper",
        "footer"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header-wrapper",
        "header",
        "footer.footer-wrapper",
        "footer",
        "nav#nav",
        "noscript",
        "link",
        "script"
      ]);
      element.querySelectorAll("span.icon").forEach((span) => {
        const iconClass = [...span.classList].find((c) => c.startsWith("icon-"));
        if (iconClass) {
          span.replaceWith(document.createTextNode(`:${iconClass.substring(5)}:`));
        } else {
          span.remove();
        }
      });
      element.querySelectorAll("picture > source, source").forEach((s) => s.remove());
      element.querySelectorAll("*").forEach((el) => {
        RUNTIME_ATTRS.forEach((attr) => el.removeAttribute(attr));
      });
    }
  }

  // tools/importer/transformers/sravaneds-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2 && !sections.some((s) => s && s.style)) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home-page.js
  var PAGE_TEMPLATE = {
    name: "home-page",
    description: "Home page: page-label paragraph followed by a hero banner",
    urls: [
      "https://main--eds-ue-project--sravaneds.aem.page/home-page"
    ],
    blocks: [
      {
        name: "hero",
        instances: ["main .hero-wrapper > .hero", "main .hero.block"]
      }
    ],
    sections: [
      {
        id: "rc1",
        name: "home-intro",
        selector: ["main > .section.hero-container", "main > .section"],
        style: null,
        blocks: ["hero"],
        defaultContent: ["main > .section > .default-content-wrapper"]
      }
    ]
  };
  var parsers = {
    hero: parse
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_page_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_page_exports);
})();

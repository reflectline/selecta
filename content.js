let menu = null;
let selectionRect = null;

const SAFE_MARGIN_X = 250; // горизонтальная зона безопасности
const SAFE_MARGIN_Y = 50;  // вертикальная зона безопасности

const yandexIconURL = (() => {
    try { return chrome.runtime.getURL("icons/extends/yandex.png"); }
    catch { return ""; }
})();
const googleIconURL = (() => {
    try { return chrome.runtime.getURL("icons/extends/google.png"); }
    catch { return ""; }
})();
const copyIconURL = (() => {
    try { return chrome.runtime.getURL("icons/extends/copy.png"); }
    catch { return ""; }
})();
const xIconURL = (() => {
    try { return chrome.runtime.getURL("icons/extends/x.png"); }
    catch { return ""; }
})();
const logoinsideIconURL = (() => {
    try { return chrome.runtime.getURL("icons/extends/logoinside.png"); }
    catch { return ""; }
})();


document.addEventListener("mouseup", (e) => {
    if (menu && (e.composedPath?.()?.includes(menu) || menu.contains(e.target))) return;
    if (menu) return;
    if (e.button === 2) return;
    if (justOpenedContextMenu) return;

    setTimeout(() => {
        const selection = window.getSelection?.();
        if (!selection) return removeMenu();

        const activeEl = document.activeElement;
        if (
            activeEl &&
            (
                activeEl.tagName === "INPUT" ||
                activeEl.tagName === "TEXTAREA" ||
                activeEl.isContentEditable
            )
        ) return;

        if (isInInput(selection)) return;

        const text = selection.toString().trim();
        if (!text) return removeMenu();

        const edge = getEdgeRect(selection);
        if (!edge) return;

        selectionRect = edge.rect;
        showMenuAt(edge.rect, text, edge.isDown, e);
    }, 0);
});

let justOpenedContextMenu = false;

document.addEventListener("contextmenu", (e) => {
    justOpenedContextMenu = true;
    if (menu) removeMenu();
    setTimeout(() => (justOpenedContextMenu = false), 200);
}, true);


document.addEventListener("mousedown", (e) => {
    if (e.button === 2 && menu) {removeMenu();}
}, true);

document.addEventListener("mousedown", (e) => {
    if (menu && !(e.composedPath?.()?.includes(menu) || menu.contains(e.target))) removeMenu();
});

document.addEventListener("mousemove", (e) => {
    if (!menu || !selectionRect) return;

    const {top, bottom, left, right} = selectionRect;
    if (
        e.clientX < left - SAFE_MARGIN_X || e.clientX > right + SAFE_MARGIN_X ||
        e.clientY < top - SAFE_MARGIN_Y || e.clientY > bottom + SAFE_MARGIN_Y
    ) {
        removeMenu();
    }
});

function isInInput(selection) {
    if (!selection?.anchorNode) return false;

    let el = selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode
        : selection.anchorNode.parentElement;

    while (el) {
        if (el.closest("input, textarea, [contenteditable='true']")) return true;
        const role = el.getAttribute?.("role");
        if (["combobox", "search", "textbox"].includes(role)) return true;
        const tag = el.tagName?.toLowerCase?.();
        if (["textarea", "input"].includes(tag)) return true;
        el = el.parentElement;
    }
    return false;
}



function showMenuAt(rect, text, isDown, mouseEvent) {
    removeMenu();

    const userLang = navigator.language || navigator.userLanguage;
    const copyText = userLang.startsWith("ru") ? "Копировать" : "Copy text";

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = `${window.scrollY}px`;
    container.style.left = `${window.scrollX}px`;
    container.style.zIndex = "999999";
    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: "open" });

    const css = `
    /* MAIN MENU CONTAINER ------------------------ */
    .text-menu {
      position: absolute;
      display: flex;
      align-items: center;
      padding: 4px;
      background: #282828;
      border-radius: 8px;
      z-index: 999999;
      font-family:  Montserrat, sans-serif; 
      font-size: 13px; 
      color: #fff;
    }
    
    .text-menu button,
    .text-menu button * {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      color: inherit;
    }
    
    /* LOGO INSIDE ----------------------------------- */
    .logoinside {
      width: 16px;          
      height: 16px;
      display: block;
      padding-left: 4px;
      padding-right: 2px;
      flex-shrink: 0;
      object-fit: contain; 
    }
    
    /* COPY BUTTON + IMG COPY ------------------------ */
    #copyBtn {
      white-space: nowrap;
      background: #282828;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      border-radius: 6px;
      color: #fff;
      padding: 0px 12px 0px 8px;
     
    }
    #copyBtn:hover {
      color: #ffffff;
      background: #4c4c4c;
      
    }
    .copyImg {
      width: 24px;          
      height: 24px;
      margin-right: 2px;
      display: block;
      flex-shrink: 0;
      object-fit: contain;
    }
    
  /* OTHER ICONS ---------------------------------- */
    #yandexBtn, #googleBtn {
      background: #282828;
      border: none;
      cursor: pointer;
      justify-content: center;
      transition: all 0.15s;
      border-radius: 6px;
      color: #fff;
      padding: 4px 6px 4px 6px;
  }
    #yandexBtn img,
    #googleBtn img,
    #closeBtn img {
      width: 16px;         
      height: 16px;
      object-fit: contain; 
      display: block;      
  }
   
    #yandexBtn:hover {
      background: #4c4c4c;
   }
    #googleBtn:hover {
      background: #4c4c4c;
   }
   
   /* X ------------------------------------------ */
   #closeBtn {
      background: #282828;
      border: none;
      cursor: pointer;
      justify-content: center;
      transition: all 0.15s;
      border-radius: 6px;
      color: #fff;
      padding: 4px 6px;
   }
   #closeBtn:hover {
      background: #4c4c4c;
   }
  
  /* SEPARATORS ------------------------ */
   .text-menu .separator {
      width: 1px;
      height: 16px;
      background: #555;
      margin: 0 4px;
      flex-shrink: 0;
    }
  `;
    shadow.innerHTML = `<style>${css}</style>
      <div class="text-menu">
      <img class="logoinside" src="${logoinsideIconURL}" alt="${logoinsideIconURL}"></button>
       <div class="separator"></div>
        <button id="copyBtn">
            <img class="copyImg" src="${copyIconURL}" alt="${copyText}">
            ${copyText}
        </button>
        <div class="separator"></div>
        <button id="yandexBtn"><img src="${yandexIconURL}" alt="${yandexIconURL}"></button>
        <div class="separator"></div>
        <button id="googleBtn"><img src="${googleIconURL}" alt="${googleIconURL}"></button>
        <div class="separator"></div>
       <button id="closeBtn"><img src="${xIconURL}" alt="${xIconURL}"></button>
      </div>
    `;

    menu = shadow.querySelector(".text-menu");

    requestAnimationFrame(() => {
        if (!menu) return;
        const offsetTop = 3;
        const offsetBottom = 6;
        menu.style.top = isDown
            ? `${rect.bottom + offsetBottom}px`
            : `${rect.top - menu.offsetHeight - offsetTop}px`;
        menu.style.left = `${rect.left + rect.width / 2 - menu.offsetWidth / 2}px`;

        const MARGIN_LEFT = 8;
        const MARGIN_RIGHT = 24;

        let left = rect.left + rect.width / 2 - menu.offsetWidth / 2 + window.scrollX;

        const viewportWidth = window.innerWidth;
        const menuWidth = menu.offsetWidth;

        if (left < window.scrollX + MARGIN_LEFT) {
            left = window.scrollX + MARGIN_LEFT;
        }

        const rightEdge = window.scrollX + viewportWidth - MARGIN_RIGHT;
        if (left + menuWidth > rightEdge) {
            left = rightEdge - menuWidth;
        }

        menu.style.left = `${left}px`;
    });

    shadow.querySelector("#copyBtn")?.addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        removeMenu();
    });
    shadow.querySelector("#yandexBtn")?.addEventListener("click", () => {
        if (yandexIconURL) window.open(`https://yandex.ru/search/?text=${encodeURIComponent(text)}`, "_blank");
        removeMenu();
    });
    shadow.querySelector("#googleBtn")?.addEventListener("click", () => {
        if (googleIconURL) window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, "_blank");
        removeMenu();
    });
    shadow.querySelector("#closeBtn")?.addEventListener("click", removeMenu);
}

function removeMenu() {
    if (!menu) return;
    const container = menu.getRootNode().host;
    if (container?.parentNode) container.remove();
    menu = null;
    selectionRect = null;
}

function getEdgeRect(selection) {
    try {
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0).cloneRange();
        const isLTR = isSelectionLTR(selection);

        let node = isLTR ? selection.focusNode : selection.anchorNode;
        let offset = isLTR ? selection.focusOffset : selection.anchorOffset;

        while (node && node.nodeType !== Node.TEXT_NODE) node = node.firstChild || node;
        if (!node || !node.textContent) return {rect: range.getBoundingClientRect(), isDown: true};

        offset = Math.max(0, Math.min(offset, node.textContent.length));
        const r = document.createRange();
        if (isLTR) r.setStart(node, Math.max(0, offset - 1)), r.setEnd(node, offset);
        else r.setStart(node, offset), r.setEnd(node, Math.min(node.textContent.length, offset + 1));

        const rect = r.getClientRects()[0] || range.getBoundingClientRect();
        const isDown = !!(selection.anchorNode.compareDocumentPosition(selection.focusNode) & Node.DOCUMENT_POSITION_FOLLOWING);
        return {rect, isDown};
    } catch (err) {
        console.warn("getEdgeRect error:", err);
        return null;
    }
}

function isSelectionLTR(selection) {
    if (!selection.rangeCount) return true;

    try {
        const range = selection.getRangeAt(0);
        const startRange = range.cloneRange();
        startRange.collapse(true);
        const endRange = range.cloneRange();
        endRange.collapse(false);

        const startRect = startRange.getBoundingClientRect();
        const endRect = endRange.getBoundingClientRect();

        if (!startRect || !endRect) return true;
        return startRect.left <= endRect.left;
    } catch {
        return true;
    }
}

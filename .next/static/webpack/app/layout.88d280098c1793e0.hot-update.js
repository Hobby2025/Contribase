"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/layout",{

/***/ "(app-pages-browser)/./src/components/ScrollToTop.tsx":
/*!****************************************!*\
  !*** ./src/components/ScrollToTop.tsx ***!
  \****************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ ScrollToTop)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\nfunction ScrollToTop() {\n    _s();\n    const [isVisible, setIsVisible] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    // 스크롤 위치에 따라 버튼 표시 여부 결정\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"ScrollToTop.useEffect\": ()=>{\n            const toggleVisibility = {\n                \"ScrollToTop.useEffect.toggleVisibility\": ()=>{\n                    if (window.scrollY > 300) {\n                        setIsVisible(true);\n                    } else {\n                        setIsVisible(false);\n                    }\n                }\n            }[\"ScrollToTop.useEffect.toggleVisibility\"];\n            window.addEventListener('scroll', toggleVisibility);\n            return ({\n                \"ScrollToTop.useEffect\": ()=>window.removeEventListener('scroll', toggleVisibility)\n            })[\"ScrollToTop.useEffect\"];\n        }\n    }[\"ScrollToTop.useEffect\"], []);\n    // 페이지 상단으로 스크롤하는 함수\n    const scrollToTop = ()=>{\n        window.scrollTo({\n            top: 0,\n            behavior: 'smooth'\n        });\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n        children: isVisible && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n            onClick: scrollToTop,\n            className: \"fixed bottom-8 right-8 p-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all duration-300 z-50 animate-pulse hover:animate-none\",\n            \"aria-label\": \"페이지 상단으로 이동\",\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"svg\", {\n                xmlns: \"http://www.w3.org/2000/svg\",\n                className: \"h-6 w-6\",\n                fill: \"none\",\n                viewBox: \"0 0 24 24\",\n                stroke: \"currentColor\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"path\", {\n                    strokeLinecap: \"round\",\n                    strokeLinejoin: \"round\",\n                    strokeWidth: 2,\n                    d: \"M5 15l7-7 7 7\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\J\\\\Desktop\\\\Contribase\\\\src\\\\components\\\\ScrollToTop.tsx\",\n                    lineNumber: 46,\n                    columnNumber: 13\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\J\\\\Desktop\\\\Contribase\\\\src\\\\components\\\\ScrollToTop.tsx\",\n                lineNumber: 39,\n                columnNumber: 11\n            }, this)\n        }, void 0, false, {\n            fileName: \"C:\\\\Users\\\\J\\\\Desktop\\\\Contribase\\\\src\\\\components\\\\ScrollToTop.tsx\",\n            lineNumber: 34,\n            columnNumber: 9\n        }, this)\n    }, void 0, false);\n}\n_s(ScrollToTop, \"J3yJOyGdBT4L7hs1p1XQYVGMdrY=\");\n_c = ScrollToTop;\nvar _c;\n$RefreshReg$(_c, \"ScrollToTop\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9jb21wb25lbnRzL1Njcm9sbFRvVG9wLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFNEM7QUFFN0IsU0FBU0U7O0lBQ3RCLE1BQU0sQ0FBQ0MsV0FBV0MsYUFBYSxHQUFHSiwrQ0FBUUEsQ0FBQztJQUUzQyx5QkFBeUI7SUFDekJDLGdEQUFTQTtpQ0FBQztZQUNSLE1BQU1JOzBEQUFtQjtvQkFDdkIsSUFBSUMsT0FBT0MsT0FBTyxHQUFHLEtBQUs7d0JBQ3hCSCxhQUFhO29CQUNmLE9BQU87d0JBQ0xBLGFBQWE7b0JBQ2Y7Z0JBQ0Y7O1lBRUFFLE9BQU9FLGdCQUFnQixDQUFDLFVBQVVIO1lBRWxDO3lDQUFPLElBQU1DLE9BQU9HLG1CQUFtQixDQUFDLFVBQVVKOztRQUNwRDtnQ0FBRyxFQUFFO0lBRUwsb0JBQW9CO0lBQ3BCLE1BQU1LLGNBQWM7UUFDbEJKLE9BQU9LLFFBQVEsQ0FBQztZQUNkQyxLQUFLO1lBQ0xDLFVBQVU7UUFDWjtJQUNGO0lBRUEscUJBQ0U7a0JBQ0dWLDJCQUNDLDhEQUFDVztZQUNDQyxTQUFTTDtZQUNUTSxXQUFVO1lBQ1ZDLGNBQVc7c0JBRVgsNEVBQUNDO2dCQUNDQyxPQUFNO2dCQUNOSCxXQUFVO2dCQUNWSSxNQUFLO2dCQUNMQyxTQUFRO2dCQUNSQyxRQUFPOzBCQUVQLDRFQUFDQztvQkFDQ0MsZUFBYztvQkFDZEMsZ0JBQWU7b0JBQ2ZDLGFBQWE7b0JBQ2JDLEdBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBT2hCO0dBcER3QnpCO0tBQUFBIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEpcXERlc2t0b3BcXENvbnRyaWJhc2VcXHNyY1xcY29tcG9uZW50c1xcU2Nyb2xsVG9Ub3AudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50JztcclxuXHJcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTY3JvbGxUb1RvcCgpIHtcclxuICBjb25zdCBbaXNWaXNpYmxlLCBzZXRJc1Zpc2libGVdID0gdXNlU3RhdGUoZmFsc2UpO1xyXG5cclxuICAvLyDsiqTtgazroaQg7JyE7LmY7JeQIOuUsOudvCDrsoTtirwg7ZGc7IucIOyXrOu2gCDqsrDsoJVcclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgdG9nZ2xlVmlzaWJpbGl0eSA9ICgpID0+IHtcclxuICAgICAgaWYgKHdpbmRvdy5zY3JvbGxZID4gMzAwKSB7XHJcbiAgICAgICAgc2V0SXNWaXNpYmxlKHRydWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldElzVmlzaWJsZShmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRvZ2dsZVZpc2liaWxpdHkpO1xyXG5cclxuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdG9nZ2xlVmlzaWJpbGl0eSk7XHJcbiAgfSwgW10pO1xyXG5cclxuICAvLyDtjpjsnbTsp4Ag7IOB64uo7Jy866GcIOyKpO2BrOuhpO2VmOuKlCDtlajsiJhcclxuICBjb25zdCBzY3JvbGxUb1RvcCA9ICgpID0+IHtcclxuICAgIHdpbmRvdy5zY3JvbGxUbyh7XHJcbiAgICAgIHRvcDogMCxcclxuICAgICAgYmVoYXZpb3I6ICdzbW9vdGgnXHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPD5cclxuICAgICAge2lzVmlzaWJsZSAmJiAoXHJcbiAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgb25DbGljaz17c2Nyb2xsVG9Ub3B9XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJmaXhlZCBib3R0b20tOCByaWdodC04IHAtMyByb3VuZGVkLWZ1bGwgYmctcHJpbWFyeS02MDAgdGV4dC13aGl0ZSBzaGFkb3ctbGcgaG92ZXI6YmctcHJpbWFyeS03MDAgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIHotNTAgYW5pbWF0ZS1wdWxzZSBob3ZlcjphbmltYXRlLW5vbmVcIlxyXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIu2OmOydtOyngCDsg4Hri6jsnLzroZwg7J2064+ZXCJcclxuICAgICAgICA+XHJcbiAgICAgICAgICA8c3ZnIFxyXG4gICAgICAgICAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtNiB3LTZcIiBcclxuICAgICAgICAgICAgZmlsbD1cIm5vbmVcIiBcclxuICAgICAgICAgICAgdmlld0JveD1cIjAgMCAyNCAyNFwiIFxyXG4gICAgICAgICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICA8cGF0aCBcclxuICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBcclxuICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgXHJcbiAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9ezJ9IFxyXG4gICAgICAgICAgICAgIGQ9XCJNNSAxNWw3LTcgNyA3XCIgXHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICA8L3N2Zz5cclxuICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgKX1cclxuICAgIDwvPlxyXG4gICk7XHJcbn0gIl0sIm5hbWVzIjpbInVzZVN0YXRlIiwidXNlRWZmZWN0IiwiU2Nyb2xsVG9Ub3AiLCJpc1Zpc2libGUiLCJzZXRJc1Zpc2libGUiLCJ0b2dnbGVWaXNpYmlsaXR5Iiwid2luZG93Iiwic2Nyb2xsWSIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwic2Nyb2xsVG9Ub3AiLCJzY3JvbGxUbyIsInRvcCIsImJlaGF2aW9yIiwiYnV0dG9uIiwib25DbGljayIsImNsYXNzTmFtZSIsImFyaWEtbGFiZWwiLCJzdmciLCJ4bWxucyIsImZpbGwiLCJ2aWV3Qm94Iiwic3Ryb2tlIiwicGF0aCIsInN0cm9rZUxpbmVjYXAiLCJzdHJva2VMaW5lam9pbiIsInN0cm9rZVdpZHRoIiwiZCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/components/ScrollToTop.tsx\n"));

/***/ }),

/***/ "(app-pages-browser)/./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (\"278d43bc1b62\");\nif (true) { module.hot.accept() }\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9zdHlsZXMvZ2xvYmFscy5jc3MiLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGlFQUFlLGNBQWM7QUFDN0IsSUFBSSxJQUFVLElBQUksaUJBQWlCIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEpcXERlc2t0b3BcXENvbnRyaWJhc2VcXHNyY1xcc3R5bGVzXFxnbG9iYWxzLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBcIjI3OGQ0M2JjMWI2MlwiXG5pZiAobW9kdWxlLmhvdCkgeyBtb2R1bGUuaG90LmFjY2VwdCgpIH1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/styles/globals.css\n"));

/***/ })

});
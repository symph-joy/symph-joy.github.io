import { Component, IComponentLifecycle } from "@symph/core";
import * as fs from "fs";
import * as path from "path";
import { join } from "path";
import { Value } from "@symph/config";
import { NotFoundException } from "@symph/server/dist/exceptions-common";
import { marked } from "marked";
import { hashReg } from "../../client/utils/constUtils";

export interface DocMenu {
  title: string;
  path: string;
  file: string;
  children?: DocMenu[];
}

export class Doc {
  title: string;
  path: string;
  file: string;
  htmlContent?: string;
  mdContent?: string;
  children?: Doc[];
  hasMenu?: boolean;
  anchor?: TreeItem[] | [];
}

export class MenuJsonType {
  title: string;
  path?: string;
  search?: boolean;
  children?: MenuJsonType[];
}

export class DocJoyConfig {
  dir: string | string[];
}

export interface TreeItem {
  children?: TreeItem[];
  type?: string;
  raw?: string;
  depth?: number;
  text?: string;
  tokens?: [];
  id?: string;
  path?: string;
  file?: string;
}

@Component()
export class DocsService implements IComponentLifecycle {
  @Value({ configKey: "docs" })
  public configDocs: DocJoyConfig;

  public searchDoc: Doc[];

  public allDocsCache: Map<string, Doc> = new Map<string, Doc>();

  public allMenusCache: Map<string, DocMenu> = new Map<string, DocMenu>();

  public titleArray: TreeItem[];

  initialize() {
    this.getAllDocs();
  }

  // 获取所有menus、文档、所有搜索需要的树结构
  private getAllDocs(): void {
    this.getAllMenus();
    // 用除去@的menus获取
    const res = [];
    for (const menu of this.searchDoc) {
      this.getOneSearchTree(menu, res);
    }
    this.titleArray = res;
  }

  // 所有搜索需要的树结构
  public getTitleArray(): TreeItem[] {
    return this.titleArray;
  }

  private getOneSearchTree(menu: Doc, res: unknown[]): void {
    if (menu.children) {
      for (const child of menu.children) {
        this.getOneSearchTree(child, res);
      }
    } else {
      // 此时mdContent一定存在
      const doc = this.getDocTitleByLevel(menu.mdContent, 3, 0);
      const obj = {
        text: menu.path,
        ...doc[0],
        path: menu.path,
        file: menu.file,
      };
      res.push(obj);
    }
  }

  // 获取所有menus和文档
  public getAllMenus(): DocMenu[] {
    const { dir } = this.configDocs || {};
    const menu = this.getMenusByDir(dir, "allMenus");
    this.setMenuCache(menu);
    return menu;
  }

  // 当前页面的menu
  public getMenus(path: string): DocMenu[] {
    let { dir } = this.configDocs || {};
    dir += path;
    dir = dir.slice(1);
    const menu = this.allMenusCache.get(dir as string);
    return menu?.children;
  }

  private setMenuCache(menus: DocMenu[]): void {
    this.allMenusCache.clear();
    for (const menu of menus) {
      const { title, file } = menu;
      if (title) {
        this.allMenusCache.set("/" + file, menu);
      }
    }
  }

  private getMenusByDir(dir: string | string[], key: string): DocMenu[] {
    if (!dir) {
      console.warn("Warning: Doc dir is not config.");
      return [];
    }
    const dirs = typeof dir === "string" ? [dir] : dir;
    return this.fmtMenus(this.scanDir(dirs, key));
  }

  private scanDir(dirs: string[], key: string): Doc[] {
    const docs = [] as Doc[];
    const docsSearch = [] as Doc[];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        console.warn(`Warning: Document root dir(${dir}) is not exists.`);
        return [];
      }
      const dirState = fs.statSync(dir);
      if (dirState.isFile()) {
        throw new Error(`Document root path(${dir}) is a file, expect is a directory.`);
      }
      const { doc, searchDoc } = this.recursiveFindDoc(dir, "", dir);
      doc?.children && docs.push(...doc.children);
      // 获取所有menu时才需要获取search内容
      if (key === "allMenus") {
        // 除去@开头文件的doc
        searchDoc?.children && docsSearch.push(...searchDoc.children);
        this.searchDoc = docsSearch;
      }
    }
    if (key === "allMenus") {
      this.setCache(docs);
    }
    return docs;
  }

  private recursiveFindDoc(dir: string, parentPath: string, rootDir: string): { doc: Doc; searchDoc: Doc } {
    const baseName = path.basename(dir);
    const menuItemConfig = this.tryGetMenuConfig(dir);
    const nodePath = menuItemConfig?.path || baseName;
    let menuPath = parentPath + "/" + nodePath;
    const menuTitle = menuItemConfig?.title || nodePath;
    const menuSearch = menuItemConfig && menuItemConfig.hasOwnProperty("search") ? menuItemConfig.search : true;
    let children: Doc[] | undefined;
    // 除去@开头的文件
    let childrenSearch: Doc[] | undefined;
    children = [];
    childrenSearch = [];
    const childPaths = fs.readdirSync(dir);
    childPaths.forEach((filePath: string) => {
      if (filePath.startsWith(".") || filePath.startsWith("_")) {
        return;
      }
      const absolutePath = join(dir, filePath);
      const pathStat = fs.statSync(absolutePath);
      if (pathStat.isDirectory()) {
        const child = this.recursiveFindDoc(absolutePath, menuPath, rootDir);
        // this.sortMenu(child);
        if (child) {
          if (!filePath.startsWith("@") && menuSearch) {
            childrenSearch.push(child.searchDoc);
          }
          children.push(child.doc);
        }
      } else {
        if (!/\.md$/i.test(absolutePath)) {
          return;
        }
        let baseName = path.basename(absolutePath);
        const childNodePath = baseName.slice(0, baseName.indexOf("."));
        let childPath = `${parentPath}/${nodePath}/${childNodePath}`;
        const childTitle = childNodePath;
        let title;
        // 不支持menu.json中嵌套多个children，只支持一级children
        if (menuItemConfig?.children) {
          title = this.getMenuJsonTitleName(menuItemConfig?.children, childPath);
        }
        // 去掉path前的数字
        childPath = this.deletePathNumber(childPath);
        let test = childPath.split("/");
        test.splice(1, 1);
        childPath = test.join("/");
        let doc = {
          title: title || childTitle,
          path: childPath,
          file: absolutePath,
          hasMenu: title ? true : false,
        } as Doc;
        doc = this.getDocHtmlContent(doc, childPath);
        children.push(doc as Doc);
        if (!this.fileStartWithSymbol(dir, "@") && menuSearch) {
          childrenSearch.push({
            ...doc,
            title: title || childTitle,
            path: childPath,
            file: absolutePath,
          });
        }
      }
    });
    let test = menuPath.split("/");
    test.splice(1, 1);
    menuPath = test.join("/");
    menuPath = menuPath.replace(/(\\)+/g, "/");
    dir = dir.replace(/(\\)+/g, "/");
    return {
      doc: { title: menuTitle, path: menuPath, file: dir, children },
      searchDoc: {
        title: menuTitle,
        path: menuPath,
        file: dir,
        children: childrenSearch,
      },
    };
  }

  private fileStartWithSymbol(file: string, symbol: string): boolean {
    for (const arr of file.split("/")) {
      if (arr.startsWith(symbol)) {
        return true;
      }
    }
    return false;
  }

  // 处理有关HtmlContent的所有，包含anchor和title
  private getDocHtmlContent(doc: Doc, docPath: string): Doc {
    // 开发模式下不使用缓存
    if (doc.htmlContent === undefined || process.env.NODE_ENV === "development") {
      if (!doc.file) {
        throw new Error(`Doc file is not defined. doc Path: ${docPath}`);
      }
      doc.mdContent = fs.readFileSync(doc.file, { encoding: "utf-8" });
      doc.htmlContent = this.markdownToHtml(doc.mdContent);
      doc.anchor = this.getDocTitleByLevel(doc.mdContent, 4, 1);
      if (!doc.hasMenu) {
        const title = this.getDocTitleByLevel(doc.mdContent, 1, 0);
        doc.title = title && title[0]?.text;
      }
    }
    return doc;
  }

  // 获取指定区间的heading
  private getDocTitleByLevel(mdContent: string, max: number, min: number): TreeItem[] | [] {
    const trees = marked.lexer(mdContent);
    const titleTree = [];
    for (const tree of trees) {
      if (tree.type === "heading" && tree.depth <= max && tree.depth > min) {
        let id = "#" + this.regId(tree.text);
        titleTree.push({
          ...tree,
          id,
        });
      }
    }
    if (titleTree.length !== 0) {
      const renderTree = { children: [] };
      const res = this.getMarkdownTree(0, renderTree, renderTree, titleTree);
      return res.children;
    } else {
      return [];
    }
  }

  private setCache(docs: Doc[]): void {
    this.allDocsCache.clear();
    const findDoc = (children: Doc[]) => {
      for (const child of children) {
        const { file, children, path } = child;
        if (file) {
          this.allDocsCache.set(path, child);
        }
        if (children) {
          findDoc(children);
        }
      }
    };
    findDoc(docs);
  }

  public getDoc(docPath: string): Doc {
    let doc = this.allDocsCache.get(docPath);
    if (!doc) {
      throw new NotFoundException(docPath, `Doc was not found, path: ${docPath}`);
    }
    return this.getDocHtmlContent(doc, docPath);
  }

  private regId(id: string): string {
    return encodeURIComponent(id.replace(hashReg, "").replace(new RegExp(/( )/g), "-").toLowerCase());
  }

  private getParent = (index: number, res: TreeItem, markdown: TreeItem[]): TreeItem => {
    const i = index;
    if (markdown[i].depth - 1 === 1) {
      return res;
    } else {
      while (markdown[i].depth - 1 != markdown[index].depth) {
        index--;
      }
      return markdown[index];
    }
  };

  private getMarkdownTree = (index: number, ele: TreeItem, res: TreeItem, markdown: TreeItem[]): TreeItem => {
    ele.children = ele.children || [];
    if (index === markdown.length - 1) {
      ele.children.unshift(markdown[index]);
      return ele;
    }
    if (markdown[index].depth === markdown[index + 1].depth) {
      ele = this.getMarkdownTree(index + 1, ele, res, markdown);
      ele.children.unshift(markdown[index]);
    } else if (markdown[index].depth < markdown[index + 1].depth) {
      ele.children.unshift(this.getMarkdownTree(index + 1, markdown[index], res, markdown));
    } else {
      ele.children.unshift(markdown[index]);
      this.getMarkdownTree(index + 1, this.getParent(index + 1, res, markdown), res, markdown);
    }
    return ele;
  };

  private markdownToHtml(mdContent: string): string {
    marked.setOptions({
      highlight: function (code, lang) {
        const hljs = require("highlight.js");
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
    });
    const renderer = {
      heading: (text, level, raw) => {
        return `
                <h${level} id="${this.regId(raw)}">
                  ${text}
                </h${level}>`;
      },
    };
    marked.use({ renderer });
    const htmlContent = marked.parse(mdContent);
    return htmlContent;
  }

  private fmtMenus(docs: Doc[]): DocMenu[] {
    const menus = [] as DocMenu[];
    for (const doc of docs) {
      const { children, ...menu } = doc;
      let menuChildren: DocMenu[] | undefined;
      if (children) {
        menuChildren = this.fmtMenus(children);
      }
      menus.push({
        ...menu,
        children: menuChildren,
      });
    }
    return menus;
  }

  private getMenuJsonTitleName(children: MenuJsonType[], path: string): string {
    for (const child of children) {
      if (child.path === path) {
        return child.title;
      } else {
        if (Array.isArray(child.children)) {
          this.getMenuJsonTitleName(child.children, path);
        }
      }
    }
  }

  private compareFile(first, second) {
    for (let i = 0; i < first.length; i++) {
      if (second[i] === undefined) {
        return true;
      }
      if (first[i] !== second[i]) {
        if (isNaN(first[i]) && !isNaN(second[i])) {
          return true;
        }
        if (!isNaN(first[i]) && isNaN(second[i])) {
          return false;
        }
        return first[i] > second[i];
      }
    }
  }
  // 按照数字、字母排序
  private sortMenu(menus: Doc): DocMenu {
    if (menus.children.length > 1) {
      let arr = menus.children;
      for (let i = arr.length - 1; i > 0; i--) {
        for (let j = 0; j < i; j++) {
          let first = arr[j].file.split("/");
          first = first[first.length - 1].split(".")[0].split("-");
          let second = arr[j + 1].file.split("/");
          second = second[second.length - 1].split(".")[0].split("-");
          if (this.compareFile(first, second)) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
        }
      }
    } else {
      return menus;
    }
  }

  private deletePathNumber(path: string): string {
    const array = path.split("/");
    const result = [];
    for (const arr of array) {
      const temArr = arr.split("-");
      let res = [];
      for (const tem of temArr) {
        if (isNaN(+tem)) {
          res.push(tem);
        }
      }
      result.push(res.join("-"));
    }
    return result.join("/");
  }

  private tryGetMenuConfig(absDirPath: string): MenuJsonType | undefined {
    const configFilePath = path.join(absDirPath, "menu.json");
    if (!fs.existsSync(configFilePath)) {
      return undefined;
    }
    const data = fs.readFileSync(configFilePath, { encoding: "utf-8" });
    return JSON.parse(data);
  }
}

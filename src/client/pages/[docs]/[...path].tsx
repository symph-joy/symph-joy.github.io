import React, { ReactNode } from "react";
import { BaseReactController, ReactController, RouteParam } from "@symph/react";
import { Spin, Anchor } from "antd";
import styles from "./docs.less";
import { Prerender, IJoyPrerender, TJoyPrerenderApi, Head } from "@symph/joy/react";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Inject } from "@symph/core";
import Doc from "../../component/doc";
const { Link } = Anchor;

@ReactController()
export default class Path extends BaseReactController {
  @RouteParam({ name: "path" })
  docPath: string;

  @Inject()
  public docsModel: DocsModel;

  hash: string;
  state = {
    showDrawer: false,
  };

  componentDidUpdate() {
    this.scrollEle();
  }

  scrollEle() {
    const hash = window.location.hash?.slice(1);
    if (!hash) {
      window.scrollTo(0, 0);
      this.hash = "";
    } else {
      if (this.hash !== hash) {
        const ele = document.getElementById(hash);
        if (ele) {
          this.hash = hash;
          ele.scrollIntoView();
        }
      }
    }
  }

  observe = (selector, callback) => {
    let startTime = Date.now();
    // 检测超时, 最长 30s
    let MAX_OBSERVE_TIME = 30e3;

    let found = false;

    // 每隔 100ms 检测一次页面元素是否存在
    let intervalId = setInterval(function () {
      // 务必注意 return, 即 结束方法
      if (found) {
        clearInterval(intervalId);
        return;
      }
      let elapse = Date.now() - startTime;
      if (elapse > MAX_OBSERVE_TIME) {
        // console.log(`${selector} 元素检测超时 ${elapse} ms, 停止检测`);
        clearInterval(intervalId);
        return;
      }

      let element = document.getElementById(selector);

      // 如果没值, 则 return
      if (!element) {
        // console.log(`${selector} 元素不存在`);
        return;
      }
      found = true;
      // 向回调函数中传入 this
      callback(element);
    }, 100);
  };

  renderView(): ReactNode {
    const { loadCurrentDocErr, loadingCurrentDoc, titleTrees, currentDoc } = this.docsModel.state;
    return (
      <div className={styles.right}>
        <div className={styles.center}>
          <Spin delay={200} spinning={loadingCurrentDoc}>
            {loadCurrentDocErr ? (
              <div>
                {loadCurrentDocErr.code}:{loadCurrentDocErr.message}
              </div>
            ) : undefined}
            <Head>{currentDoc ? <title>{currentDoc.title}</title> : undefined}</Head>

            <Doc className={styles.docContent} path={this.props.location.pathname} />
          </Spin>
        </div>
        <div className={styles.titleTree}>
          {titleTrees ? (
            <Anchor>
              {titleTrees.map((value, key) => {
                if (value.children) {
                  return (
                    <Link key={key} href={value.id} title={value.text}>
                      {value.children.map((child1, key1) => {
                        if (child1.children) {
                          return (
                            <Link key={key1} href={child1.id} title={child1.text}>
                              {child1.children.map((child2, key2) => {
                                return <Link key={key2} href={child2.id} title={child2.text} />;
                              })}
                            </Link>
                          );
                        } else {
                          return <Link key={key1} href={child1.id} title={child1.text} />;
                        }
                      })}
                    </Link>
                  );
                } else {
                  return <Link key={key} href={value.id} title={value.text} />;
                }
              })}
            </Anchor>
          ) : undefined}
        </div>
      </div>
    );
  }
}

@Prerender({ routeComponent: Path })
export class DocsPrerenderGenerator implements IJoyPrerender {
  @Inject()
  public docsModel: DocsModel;

  // getRoute(): string | BaseReactController<Record<string, unknown>, Record<string, unknown>, IApplicationContext> {
  //   return "/docs/*";
  // }

  isFallback(): Promise<boolean> | boolean {
    return false;
  }

  async getPaths(): Promise<Array<string>> {
    const menus = await this.docsModel.getAllDocsMenus();
    const paths = [] as string[];
    const addChildren = (menus: DocMenuItem[]) => {
      (menus || []).forEach((menu) => {
        if (menu.children?.length) {
          addChildren(menu.children);
        } else {
          paths.push(`${menu.path}`);
        }
      });
    };
    addChildren(menus || []);
    return paths;
  }

  async getApis?(): Promise<Array<TJoyPrerenderApi>> {
    return [
      {
        path: "/docs/titleArray",
      },
    ];
  }
}

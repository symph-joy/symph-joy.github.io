import React, { ReactNode } from "react";
import { BaseReactController, ReactController } from "@symph/react";
import { Link } from "@symph/react/router-dom";
import { Layout, Typography, Button, Row, Carousel } from "antd";
import styles from "./homepage.scss";
import {
  ClusterOutlined,
  CloudServerOutlined,
  BlockOutlined,
  LinkOutlined,
  AppstoreAddOutlined,
  DeploymentUnitOutlined,
  FundViewOutlined,
} from "@ant-design/icons";
import { Prerender } from "@symph/joy/react";
import { DocsModel } from "../model/docs.model";
import { Inject } from "@symph/core";

const { Content } = Layout;
const { Paragraph } = Typography;

@Prerender()
@ReactController()
export default class HelloController extends BaseReactController {
  @Inject()
  public docModel: DocsModel;

  private birds: any;

  async initModelStaticState(): Promise<void | number> {
    await Promise.all([
      this.docModel.getSnippet("/@snippets/hello-react-controller"),
      this.docModel.getSnippet("/@snippets/hello-server-controller"),
    ]);
  }

  loadScript = async (id: string, src: string) => {
    if (document.querySelector("#" + id)) {
      return;
    }
    const js = document.createElement("script");
    js.id = id;
    js.type = "text/javascript";
    js.src = src;
    document.body.appendChild(js);
    return new Promise((resolve, reject) => {
      js.onload = resolve;
      js.onerror = reject;
    });
  };

  async componentDidMount() {
    await this.loadScript("jsThree", "https://cdn.staticfile.org/three.js/r122/three.min.js");
    await this.loadScript("jsBirds", "https://cdn.staticfile.org/vanta/0.5.22/vanta.birds.min.js");
    this.birds = (window as any).VANTA.BIRDS({
      el: "#banner",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 500.0,
      minWidth: 200.0,
      top: -80,
      scale: 1.0,
      scaleMobile: 1.0,
      backgroundAlpha: 0.0,
      color1: 0xfa541c,
      color2: 0xfaad14,
      colorMode: "variance",
      separation: 20,
      alignment: 20,
      cohesion: 20,
    });
  }

  componentWillUnmount() {
    this.birds?.destroy();
  }

  renderView(): ReactNode {
    const { snippets } = this.docModel.state;
    const docHelloReactController = snippets["/@snippets/hello-react-controller"];
    const docHelloServerController = snippets["/@snippets/hello-server-controller"];

    return (
      <Layout className={styles.root}>
        <Content>
          {/* -------- banner -------- */}
          <section role="banner" id="banner" className={styles.banner}>
            <Paragraph className={styles.banner__paragraph}>
              <h1>
                <div>@symph/joy ??? JS/TS ??????</div>
                <div className={styles.banner__wordWrap}>
                  <div style={{ "--j": 0 }}>
                    <span style={{ "--i": 1 }}>???</span>
                    <span style={{ "--i": 2 }}>???</span>
                    <span style={{ "--i": 3 }}>???</span>
                    <span style={{ "--i": 4 }}>???</span>
                    <span style={{ "--i": 5 }}>???</span>
                    {/*<span style={{ "--i": 6 }}>n</span>*/}
                    {/*<span style={{ "--i": 7 }}>.</span>*/}
                  </div>
                  <div style={{ "--j": 1 }}>
                    <span style={{ "--i": 1 }}>???</span>
                    <span style={{ "--i": 2 }}>???</span>
                    <span style={{ "--i": 3 }}>???</span>
                    <span style={{ "--i": 4 }}>???</span>
                    <span style={{ "--i": 5 }}>???</span>
                    <span style={{ "--i": 6 }}>???</span>
                    {/*<span style={{ "--i": 7 }}>v</span>*/}
                    {/*<span style={{ "--i": 8 }}>e</span>*/}
                    {/*<span style={{ "--i": 9 }}>.</span>*/}
                  </div>
                  <div style={{ "--j": 2 }}>
                    <span style={{ "--i": 1 }}>???</span>
                    <span style={{ "--i": 2 }}>???</span>
                    <span style={{ "--i": 3 }}>???</span>
                    <span style={{ "--i": 4 }}>???</span>
                    <span style={{ "--i": 5 }}>???</span>
                    <span style={{ "--i": 6 }}>???</span>
                    {/*<span style={{ "--i": 7 }}>t</span>*/}
                    {/*<span style={{ "--i": 8 }}>i</span>*/}
                    {/*<span style={{ "--i": 9 }}>v</span>*/}
                    {/*<span style={{ "--i": 10 }}>e</span>*/}
                    {/*<span style={{ "--i": 11 }}>.</span>*/}
                  </div>
                </div>
              </h1>

              <Row justify="center">
                {/*<Button>?????? JOY</Button>*/}
                <Button>
                  <Link to="/joy/start/quick-started">????????????</Link>
                </Button>
              </Row>
            </Paragraph>
          </section>

          {/* -------- news -------- */}
          {/*<section role="news" className={styles.news}>*/}
          {/*  <div className={styles.container}>*/}
          {/*    <div className={styles.news__list}>*/}
          {/*      <a href="#">????????????</a>*/}
          {/*      /!*<a href="#">Bye Bye!</a>*!/*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</section>*/}

          {/* -------- function -------- */}
          <section role="function" className={styles.function}>
            <div className={styles.container}>
              <header>
                <h1 className={styles.function__title}>??? Joy ???????????????</h1>
              </header>
              <div>
                <ul className={styles.function__list}>
                  <li>
                    <Link to={"/joy/start/introduce"}>
                      <DeploymentUnitOutlined />
                      <h2>JS/TS ????????????</h2>
                      <p>@symph/joy ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????</p>
                    </Link>
                  </li>
                  <li>
                    <Link to={"/react/start/introduce"}>
                      <FundViewOutlined />
                      <h2>React ??????</h2>
                      <p>??????????????? React ?????????????????????????????????????????????????????????????????????????????????</p>
                    </Link>
                  </li>
                  <li>
                    <Link to={"/server/start/introduce"}>
                      <CloudServerOutlined />
                      <h2>Node.js ??????</h2>
                      <p>?????? Spring Boot????????????????????????????????????????????????????????????????????????????????????</p>
                    </Link>
                  </li>
                  <li>
                    <Link to={"/joy/container/dependency-inject"}>
                      <AppstoreAddOutlined />
                      <h2>?????????</h2>
                      <p>?????????????????????????????????????????? JS/TS ????????????????????????????????????????????????</p>
                    </Link>
                  </li>

                  <li>
                    <Link to={"/joy/basic/dir-tree#?????????????????????"}>
                      <BlockOutlined />
                      <h2>??????????????????</h2>
                      <p>???????????????????????????????????????????????????????????????????????????????????????????????????????????????</p>
                    </Link>
                  </li>
                  <li>
                    <Link to={"/joy/advanced-features/export"}>
                      <ClusterOutlined />
                      <h2>???????????????</h2>
                      <p>????????????????????????????????????????????????????????????????????????????????????????????????</p>
                    </Link>
                  </li>

                  <li>
                    <Link to={"/joy/advanced-features/typescript"}>
                      <LinkOutlined />
                      <h2>????????????</h2>
                      <p>???????????????????????????TypeScript???????????????????????????????????????????????????</p>
                    </Link>
                  </li>

                  {/*<li>*/}
                  {/*  <GithubOutlined />*/}
                  {/*  <h2>Event Driven</h2>*/}
                  {/*  <p>Dolore nisi ex sunt cillum nulla ad laboris minim laborum consequat cillum.</p>*/}
                  {/*</li>*/}
                  {/*<li>*/}
                  {/*  <GitlabOutlined />*/}
                  {/*  <h2>Batch</h2>*/}
                  {/*  <p>Sunt in veniam commodo anim.</p>*/}
                  {/*</li>*/}
                </ul>
                <Carousel autoplay autoplaySpeed={5000} dots={true} effect="fade" className={styles.function__carousel}>
                  <div className={styles.function__description}>
                    <div dangerouslySetInnerHTML={{ __html: docHelloReactController?.htmlContent }}></div>
                    <div className={styles.function__description_info}>
                      <h2>?????? React ??????</h2>
                      <p>@symph/joy ??????????????????????????????????????????????????????????????????????????????</p>
                      <p>
                        ????????? <span className="code">@symph/joy</span> React??????? ????????? <Link to="docs/docs/basic/getting-started">????????????</Link>{" "}
                        ??????
                      </p>
                    </div>
                  </div>
                  <div className={styles.function__description}>
                    <div dangerouslySetInnerHTML={{ __html: docHelloServerController?.htmlContent }}></div>
                    <div className={styles.function__description_info}>
                      <h2>?????? Server ????????????</h2>
                      <p>?????? @symph/joy?????????????????????????????????????????????????????????????????????????????????</p>
                      <p>
                        ????????? <span className="code">@symph/joy</span> ???????????????? ????????? <Link to="docs/docs/basic/getting-started">????????????</Link>{" "}
                        ??????
                      </p>
                    </div>
                  </div>
                </Carousel>
              </div>
            </div>
          </section>

          {/* -------- footer -------- */}
          <footer role="footer" className={styles.footer}>
            {/*<div className={styles.footer__top}>*/}
            {/*  <div className={styles.container}>*/}
            {/*    <ul>*/}
            {/*      <li>*/}
            {/*        <h3>Get ahead</h3>*/}
            {/*        <p>Deserunt dolor dolore excepteur ut ipsum in proident aliquip ut commodo aliqua aliquip ea.</p>*/}
            {/*        <a href="#">Learn more</a>*/}
            {/*      </li>*/}
            {/*      <li>*/}
            {/*        <h3>Get support</h3>*/}
            {/*        <p>Officia proident aliquip sint cupidatat.</p>*/}
            {/*        <a href="#">Learn more</a>*/}
            {/*      </li>*/}
            {/*      <li>*/}
            {/*        <h3>Upcoming events</h3>*/}
            {/*        <p>Ea nisi sit cillum irure labore nulla mollit sunt nulla eiusmod ea proident voluptate exercitation.</p>*/}
            {/*        <a href="#">Learn more</a>*/}
            {/*      </li>*/}
            {/*    </ul>*/}
            {/*  </div>*/}
            {/*</div>*/}
            <div className={styles.footer__bottom}>
              <div className={styles.container}>
                <div className={styles.footer__contactUs}>
                  <div>????????????</div>
                  <div>
                    Github Issue:{" "}
                    <a href="https://github.com/symph-joy/symph-joy/issues" target="_blank">
                      https://github.com/symph-joy/symph-joy/issues
                    </a>
                  </div>
                  <div>QQ???: 929743297</div>
                  <div>Email: lnlfps@gmail.com</div>
                </div>
                <div className={styles.footer__MIT}>????????????????????? @symph/joy ????????????????????? | Open-source MIT Licensed | Copyright ?? 2022-present</div>
                {/*<ul>*/}
                {/*  <li>Learn</li>*/}
                {/*  <li>Quickstart</li>*/}
                {/*  <li>Guides</li>*/}
                {/*  <li>Blog</li>*/}
                {/*</ul>*/}
                {/*<ul>*/}
                {/*  <li>Community</li>*/}
                {/*  <li>Events</li>*/}
                {/*  <li>Team</li>*/}
                {/*</ul>*/}
                {/*<div className={styles.footer__bottom_subscribe}>*/}
                {/*  <h2>Get
                 the Symph Joy newsletter</h2>*/}
                {/*  <Input.Search size="large" placeholder="Email Address" enterButton={<Button>SUBSCRIBE</Button>} />*/}
                {/*  <Checkbox>Yes, I would like to be contacted by The Symph Joy Team for newsletters, promotions and events</Checkbox>*/}
                {/*</div>*/}
              </div>
            </div>
          </footer>
        </Content>
      </Layout>
    );
  }
}

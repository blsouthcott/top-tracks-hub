
export const styles = {
  // Bulma
  margins: {
    m1: "m-1",
    m2: "m-2",
    m3: "m-3",
    m4: "m-4",
    m6: "m-6",
    mt4: "mt-4",
    mt6: "mt-6",
    mr3: "mr-3",
    mb0: "mb-0",
    my3: "my-3",
    ml2: "ml-2",
    ml3: "ml-3",
  },
  padding: {
    p1: "p-1",
    pl4: "pl-4",
  },
  sizes: {
    isSize1: "is-size-1",
    isSize2: "is-size-2",
    isSize4: "is-size-4",
  },
  container: "container",
  hero: "hero",
  heroBody: "hero-body",
  isFullHeight: "is-fullheight",
  isFullWidth: "is-fullwidth",
  card: "card",
  cardHeader: "card-header",
  cardHeaderTitle: "card-header-title",
  cardContent: "card-content",
  select: "select",
  search: "search",
  input: "input",
  column: "column",
  columns: "columns",
  isCentered: "is-centered",
  isVcentered: "is-vcentered",
  isOneThird: "is-one-third",
  isTwoThirds: "is-two-thirds",
  field: "field",
  section: "section",
  label: "label",
  control: "control",
  content: "content",
  title: "title",
  isFlex: "is-flex",
  isFlexWrapWrap: "is-flex-wrap-wrap",
  isFlexDirectionColumn: "is-flex-direction-column",
  isFlexDirectionColumnTouch: "is-flex-direction-column-touch",
  isAlignContentCenter: "is-align-content-center",
  isAlignItemsCenter: "is-align-items-center",
  isJustifyContentCenter: "is-justify-content-center",
  isJustifyContentEnd: "is-justify-content-end",
  hasTextCentered: "has-text-centered",
  hasTextLeft: "has-text-left",
  hasTextLink: "has-text-link",
  hasTextWhite: "has-text-white",
  button: "button",
  buttons: "buttons",
  isPrimary: "is-primary",
  isWarning: "is-warning",
  isLight: "is-light",
  hasBackgroundPrimary: "has-background-primary",
  fullWidth: "full-width",
  table: "table",
  isBordered: "is-bordered",
  isHoverable: "is-hoverable",
  isStriped: "is-striped",
  isNarrow: "is-narrow",
  isClipped: "is-clipped",
  box: "box",
  block: "block",
  navbar: "navbar",
  navbarStart: "navbar-start",
  navbarMenu: "navbar-menu",
  navbarLink: "navbar-link",
  navbarBrand: "navbar-brand",
  navbarItem: "navbar-item",
  navbarDropdown: "navbar-dropdown",
  burger: "burger",
  burgerMenu: "burger-menu",
  navbarBurger: "navbar-burger",
  isActive: "is-active",
  hasDropdown: "has-dropdown",
  navbarEnd: "navbar-end",

  // non-Bulma
  isScrollable: "is-scrollable",
  tableHeader: "table-header",
  stickyHeader: "sticky-header",
  flash: "flash",
  audioPlayer: "audio-player",
  cursorPointer: "cursor-pointer",

  // font-awesome
  faLg: "fa-lg",
}

export const toClassName = (...styles) => (
  [...styles].join(" ")
)

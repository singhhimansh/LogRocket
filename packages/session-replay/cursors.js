
export const CursorImages = {
  ClassicCursor: new URL("../session-replay/images/mouse-cursor.webp", import.meta.url).href,
};



function classicCursor() {
  const cursor = this.doc.createElement("img");
  cursor.src = CursorImages.ClassicCursor;
  cursor.id = "__replay_cursor__";
  Object.assign(cursor.style, {
    position: "fixed",
    width: "24px",
    height: "24px",
    pointerEvents: "none",
    zIndex: "999999",
    top: "0px",
    left: "0px",
  });
  return cursor;
}

function dotCursor() {
  const cursor = this.doc.createElement("div");
  cursor.id = "__replay_cursor__";
  Object.assign(cursor.style, {
    position: "fixed",
    width: "14px",
    height: "14px",
    background: "red",
    border: "2px solid white",
    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: "999999",
    top: "0px",
    left: "0px",
    transition: "top 50ms linear, left 50ms linear",
  });
  return cursor;
}

export const CursorTypes = {
  Classic: "classic",
  Dot: "dot"
};

export function getCursorNode (type) {
  if (type === CursorTypes.Classic) {
    return classicCursor.call(this);
  } else {
    return dotCursor.call(this);
  }
}


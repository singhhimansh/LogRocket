export class Renderer {
  constructor(root) {
    this.root = root;

    this.cursor = this.createCursor();
  }

  createCursor() {
    const el = document.createElement("div");

    el.style.position = "fixed";

    el.style.width = "12px";

    el.style.height = "12px";

    el.style.borderRadius = "50%";

    el.style.background = "green";

    el.style.pointerEvents = "none";

    document.body.append(el);

    return el;
  }

  render(event) {
    switch (event.type) {
      case "mouseMove":
        this.moveCursor(event);
        break;

      case "mutation":
        this.applyMutation(event);
        break;
    }
  }

  moveCursor(event) {
    this.cursor.style.transform = `translate(${event.data.x}px, ${event.data.y}px)`;
  }

  // applyMutation(event) {
  //   const target = document.querySelector("#player");


  //   if (target) {
  //     target.outerHTML = event.data.targetNode;
  //   }
  // }
  applyMutation(event) {
  const frame =
    document.querySelector(
      "#player"
    );

  if (!frame) {
    return;
  }

  const frameDoc =
    frame.contentDocument;

  if (!frameDoc) {
    return;
  }

  const target =
    frameDoc.querySelector(
      "#output"
    );

  if (target) {
    target.outerHTML =
      event.data.targetNode;
  }
}
}

export async function getChildren(
  handle: FileSystemDirectoryHandle,
  parentKey?: string
) {
  const items = [];
  for await (const item of handle.values()) {
    const key = parentKey ? `${parentKey}/${item.name}` : item.name;
    if (item.kind === "directory") {
      items.push({
        title: item.name,
        value: key,
        key,
        children: [],
        handle: item,
        isLeaf: false,
      });
    } else {
      items.push({
        title: item.name,
        value: key,
        key,
        handle: item,
        isLeaf: true,
      });
    }
  }

  return items;
}

export async function resolveFile(
  handle: FileSystemDirectoryHandle,
  path: string,
  prefix = ""
): Promise<{
  type: "file" | "directory";
  filePath: string;
  fileContent?: string;
  children?: string[];
}> {
  const [first, ...rest] = path.split("/");
  const fullPath = prefix ? `${prefix}/${first}` : first;

  for await (const item of handle.values()) {
    if (item.name === first) {
      if (rest.length !== 0 && item.kind === "directory") {
        return await resolveFile(item, rest.join("/"), fullPath);
      } else if (rest.length === 0) {
        if (item.kind === "file") {
          const file = await item.getFile();

          const fileContent = await file.text();

          return {
            type: "file",
            filePath: fullPath,
            fileContent,
          };
        } else {
          const children = await getChildren(item, fullPath);

          return {
            type: "directory",
            filePath: fullPath,
            children: children.map((child) => child.title),
          };
        }
      }
    }
  }

  throw new Error(`File not found: ${fullPath}`);
}

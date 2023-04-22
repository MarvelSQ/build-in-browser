import { TreeSelect } from "antd";
import { getChildren } from "./utils/filehandle";
import { useEffect, useState } from "react";

function FilePicker({
  treeData,
  onSelect,
  type,
}: {
  treeData: any[];
  onSelect: (value: string) => void;
  type: "file" | "directory";
}) {
  const [innerTreeData, setTreeData] = useState<{}[]>(treeData);

  useEffect(() => setTreeData(treeData), [treeData]);

  return (
    <TreeSelect
      style={{ width: "100%" }}
      treeData={innerTreeData}
      placeholder="entry file"
      onSelect={(value, items) => {
        if (type === "directory" || items.isLeaf) {
          onSelect(value);
        }
      }}
      loadData={(item) => {
        console.log(item);
        if (item.handle) {
          return getChildren(item.handle, item.key).then((res) => {
            setTreeData((treeData) => {
              return treeData.map((treeItem) => {
                if (treeItem.key === item.key) {
                  treeItem.children = res;
                }
                return treeItem;
              });
            });
          });
        }
        return Promise.resolve();
      }}
    />
  );
}

export default FilePicker;

import { Dispatch, SetStateAction } from "react";
import { base64ToFile, generateRandomColor, mapToArr } from "../Common/util";
import { colorSH } from "../Common/color";
import { Direct } from "../DataStructure/Direction";
import { teyvat } from "../Common/teyvat";
import i18n from "../i18n/config";

export class StationProps {
  stationId!: number;
  stationName!: string;
  position!: number[];
  shape!: string;
  lineIds!: number[];
  tagDirection?: Direct;
}
export class LineProps {
  lineId!: number;
  lineName!: string;
  color!: string;
  stationIds!: number[];
  sign!: string;
  order!: number;
  bendFirst!: boolean[];
  subLine?: boolean;
}

export type ChangeSteps = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  stationId: number;
};

export type LineChanges = {
  stationId: number;
  lineId: number;
  stationIndex: number;
};

export type RecordType = StationProps[] | ChangeSteps[] | LineChanges[];

export class CardShowing {
  constructor() {
    this.stationIds = [];
    this.lineIds = [];
  }
  stationIds?: number[];
  lineIds?: number[];
  stationFirst?: boolean;
}

export type InsertInfo = { insertIndex: number; line: LineProps };

export class UserDataType {
  stations!: Map<number | string, StationProps>;
  lines!: Map<number | string, LineProps>;
  title?: string;
  backgroundColor?: string;
  backgroundImage?: File;
  opacity?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
}

export type ShowNameProps = {
  showName: boolean;
  setShowName: React.Dispatch<React.SetStateAction<boolean>>;
  autoHiddenName: boolean;
  setAutoHiddenName: React.Dispatch<React.SetStateAction<boolean>>;
};

export type DrawProps = {
  drawing: boolean;
  setDrawing: React.Dispatch<React.SetStateAction<boolean>>;
};

export type DrawerSize = {
  drawerX: number;
  drawerY: number;
};

export type TransformProps = {
  translateX: number;
  setTranslateX: React.Dispatch<React.SetStateAction<number>>;
  translateY: number;
  setTranslateY: React.Dispatch<React.SetStateAction<number>>;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
};

export type ShowTourProps = {
  showTour: boolean;
  setShowTour: React.Dispatch<React.SetStateAction<boolean>>;
};

export type PageProps = {
  page: string;
  setPage: React.Dispatch<React.SetStateAction<string>>;
};

export const initData = {
  ...teyvat,
};

export const setDataFromJson = (
  setData: Dispatch<SetStateAction<UserDataType>>,
  jsonString: string
) => {
  const res = JSON.parse(jsonString);
  const {
    stations: stationsArr,
    lines: linesArr,
    title,
    backgroundColor,
    translateX,
    translateY,
    scale,
    opacity,
    image,
  }: {
    stations: StationProps[];
    lines: LineProps[];
    title: string;
    backgroundColor: string;
    translateX: number;
    translateY: number;
    scale: number;
    opacity: number;
    image: string;
  } = res;
  const stations = stationsArr.reduce((map, cur) => {
    map.set(cur.stationId, cur);
    return map;
  }, new Map());
  const lines = linesArr.reduce((map, cur) => {
    map.set(cur.lineId, cur);
    return map;
  }, new Map());
  const data = {
    stations,
    lines,
    title,
    backgroundColor,
    translateX,
    translateY,
    scale,
    opacity,
  };
  setData(data);
  if (image)
    base64ToFile(image)
      .then((backgroundImage) => {
        setData({ ...data, backgroundImage });
      })
      .catch((e) => {
        console.error(e);
      });
  return data;
};

export const deleteStation = (
  data: UserDataType,
  setData: Dispatch<SetStateAction<UserDataType>>,
  stationId: number
) => {
  const { stations, lines } = data;
  const station = stations.get(stationId);
  const { lineIds } = station!;
  //detele stations in line
  lineIds.forEach((lineId) => {
    const newStationIds: number[] = [];
    const newBendFirst: boolean[] = [];
    const line = lines.get(lineId);
    const { stationIds, bendFirst } = line!;
    stationIds.forEach((id, index) => {
      if (stationId !== id) {
        // break the cicle
        if (id !== newStationIds[newStationIds.length - 1]) {
          newStationIds.push(id);
          newBendFirst.push(bendFirst[index]);
        }
      }
    });

    lines.set(lineId, {
      ...line!,
      stationIds: newStationIds,
      bendFirst: newBendFirst,
    });
  });
  // delete station
  stations.delete(stationId);
  setData({ ...data });
};
export const deleteLine = (
  data: UserDataType,
  setData: Dispatch<SetStateAction<UserDataType>>,
  lineId: number
) => {
  const { stations, lines } = data;
  const line = lines.get(lineId);
  const { stationIds } = line!;
  //detele stations in line
  stationIds.forEach((stationId) => {
    const newLineIds: number[] = [];
    const station = stations.get(stationId);
    const { lineIds } = station!;
    lineIds.forEach((id) => {
      if (lineId !== id) {
        newLineIds.push(id);
      }
    });
    stations.set(stationId, {
      ...station!,
      lineIds: newLineIds,
    });
  });
  // delete line
  lines.delete(lineId);
  setData({ ...data });
};
export const dataProcessor = (
  id: number,
  setData: Dispatch<SetStateAction<UserDataType>>,
  state: UserDataType
) => {
  const { stations, lines } = state;
  return {
    setStationName: (name: string) => {
      setData((state) => {
        const station = stations.get(id);
        station!.stationName = name;
        return { ...state };
      });
    },
    setStationPosition: (x: number, y: number) => {
      setData((state) => {
        const station = stations.get(id);
        station!.position = [x, y].map((x) =>
          Number.isNaN(x) ? 0 : Math.round(x)
        );
        return { ...state };
      });
    },
    setStationShape: (shape: string) => {
      setData((state) => {
        const station = stations.get(id);
        station!.shape = shape;
        return { ...state };
      });
    },
    setStationTagDirection: (direct: Direct) => {
      setData((state) => {
        const station = stations.get(id);
        station!.tagDirection = direct;
        if (direct === 8) delete station!.tagDirection;
        return { ...state };
      });
    },
    getStationById: (stationId: string | number) => {
      return stations.get(stationId);
    },
    getLineById: (lineId: string | number) => {
      return lines.get(lineId);
    },
    getStationsInThisLine: () => {
      return lines.get(id)!.stationIds.map((x) => stations.get(x));
    },
    setLineName: (name: string) => {
      setData((state) => {
        const line = lines.get(id);
        line!.lineName = name;
        return { ...state };
      });
    },
    setSign: (sign: string) => {
      setData((state) => {
        const line = lines.get(id);
        line!.sign = sign;
        return { ...state };
      });
    },
    setOrder: (order: number) => {
      setData((state) => {
        const line = lines.get(id);
        line!.order = order;
        return { ...state };
      });
    },
    setColor: (color: string) => {
      setData((state) => {
        const line = lines.get(id);
        line!.color = color;
        return { ...state };
      });
    },
    setSubLine: (subLine: boolean) => {
      setData((state) => {
        const line = lines.get(id);
        line!.subLine = subLine;
        if (!subLine) delete line!.subLine;
        return { ...state };
      });
    },
    getBendFirst: (stationIndex: number) => {
      const line = lines.get(id);
      return line?.bendFirst[stationIndex];
    },
    setBendFirst: (stationIndex: number, bendFirst: boolean) => {
      setData((state) => {
        const line = lines.get(id);
        line!.bendFirst[stationIndex] = bendFirst;
        return { ...state };
      });
    },
    deleteStation: () => deleteStation(state, setData, id),
    deleteLine: () => deleteLine(state, setData, id),
    removeStationFromLine: (lineId: number, stationIndex: number) => {
      setData((state) => {
        const station = stations.get(id);
        const line = lines.get(lineId);
        const { stationIds, bendFirst } = line!;
        if (stationIds[stationIndex] === id) {
          stationIds.splice(stationIndex, 1);
          bendFirst.splice(stationIndex, 1);
          if (!stationIds.some((stationId) => stationId === id)) {
            const { lineIds } = station!;
            station!.lineIds = lineIds.filter((id) => lineId !== id);
          }
          if (stationIds[stationIndex - 1] === stationIds[stationIndex]) {
            stationIds.splice(stationIndex, 1);
            bendFirst.splice(stationIndex, 1);
          }
        }
        return { ...state };
      });
    },
    addNewLine: () => {
      const newLine = new LineProps();
      setData((state) => {
        const maxId = mapToArr(lines).reduce(
          (pre, cur) => Math.max(pre, cur.lineId),
          0
        );
        const lineId = maxId + 1;
        Object.assign(newLine, {
          lineId: lineId,
          lineName:i18n.t("lineNo",{lineId}),
          color: colorSH[lineId - 1]
            ? colorSH[lineId - 1].color
            : generateRandomColor(),
          stationIds: [id],
          sign: lineId.toString(),
          order: lineId,
          bendFirst: [true],
        });
        const station = stations.get(id);
        const { lineIds } = station!;
        station!.lineIds = [...new Set(lineIds.concat([lineId]))];
        lines.set(lineId, newLine);
        return { ...state };
      });
      return newLine;
    },
    addStationToLine: (stationId: number, stationIndex: number) => {
      return new Promise(res=>{
       setData((state) => {
        const line = lines.get(id);
        if (!line) debugger;
        const { stationIds, bendFirst } = line!;
        console.log(structuredClone(stationIds));
        if (
          stationIds[stationIndex] !== stationId &&
          stationIds[stationIndex - 1] !== stationId
        ) {
          stationIds.splice(stationIndex, 0, stationId);
          bendFirst.splice(stationIndex, 0, true);
          if(stationIds.some((x,index)=>x===stationIds[index-1]||x===stationIds[index+1])) debugger
          const station = stations.get(stationId);
          const { lineIds } = station!;
          station!.lineIds = [...new Set(lineIds.concat([id]))];
          res(true);
        } else {
          res(false);  
        }
        return { ...state };
      }); 
      });
    },
  };
};

export const addNewStation = (
  data: UserDataType,
  setData: Dispatch<SetStateAction<UserDataType>>,
  x: number,
  y: number,
  record: StationProps[],
  setRecord: React.Dispatch<React.SetStateAction<RecordType>>,
  currentRecordIndex: number,
  setCurrentRecordIndex: React.Dispatch<React.SetStateAction<number>>,
  cardShowing: CardShowing,
  setCardShowing: Dispatch<SetStateAction<CardShowing>>,
  defaultShape: string,
) => {
  const { stations } = data;
  let max = 0;
  stations.forEach((station) => {
    max = Math.max(station.stationId, max);
  });
  const stationId = max + 1;
  const newStation = {
    stationId,
    stationName: `${i18n.t('newStation')} ${max + 1}`,
    position: [x, y].map(Math.round),
    shape: defaultShape,
    lineIds: [],
  };
  setCardShowing({ stationIds: [stationId] });
  const newRecord = record.slice(0, currentRecordIndex + 1);
  setRecord(newRecord.concat([newStation]));
  setCurrentRecordIndex(currentRecordIndex + 1);
  stations.set(max + 1, newStation);
  setData({ ...data });
};

export const addStationFromRecord = (
  data: UserDataType,
  setData: Dispatch<SetStateAction<UserDataType>>,
  station: StationProps
) => {
  const { stations } = data;
  let max = 0;
  stations.forEach((station) => {
    max = Math.max(station.stationId, max);
  });
  const newStation = { ...station, stationId: max + 1 };
  stations.set(max + 1, newStation);
  setData({ ...data });
};

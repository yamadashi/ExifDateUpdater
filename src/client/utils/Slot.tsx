import { Children, isValidElement } from 'react';
import type { FC, ReactNode } from 'react';

type PropsChildren =
  | ReactNode[]
  | ReactNode
  | ((...params: any[]) => ReactNode);

type SlotProps<Children extends PropsChildren = ReactNode> = {
  children: Children;
};
export type SlotComponent<Children extends PropsChildren = ReactNode> = FC<
  SlotProps<Children>
>;

/**
 * Slot用のコンポーネントを作成する
 */
export const createSlotComponent = function <
  Children extends PropsChildren = ReactNode
>(): SlotComponent<Children> {
  return () => null;
};

/**
 * slotコンポーネントにあるChildrenを取得する
 * @param children - Reactの子要素リスト
 * @param slot - 取得するslotコンポーネント
 */
export const getSlot = function <Children extends PropsChildren>(
  children: ReactNode,
  slot: SlotComponent<Children>
): Children | undefined {
  const child = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === slot
  );
  if (isValidElement(child)) {
    return child.props.children as Children;
  }
  return undefined;
};
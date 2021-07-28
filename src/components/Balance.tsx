import { Input, InputNumber, InputNumberProps } from 'antd';
import { CSSProperties, PropsWithChildren, useCallback, useMemo } from 'react';
import { CustomFormControlProps } from '../model';

export function Balance({
  value,
  onChange,
  children,
  className,
  ...other
}: CustomFormControlProps<string> & Omit<InputNumberProps<string>, 'value'> & PropsWithChildren<unknown>) {
  const triggerChange = useCallback(
    (val: string) => {
      if (onChange) {
        onChange(val);
      }
    },
    [onChange]
  );
  const style = useMemo(() => {
    if (!children) {
      return {};
    }

    const sty: CSSProperties = {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    };

    return sty;
  }, [children]);

  return (
    <Input.Group className="flex items-center justify-between">
      <InputNumber<string>
        {...other}
        className={className}
        style={style}
        value={value}
        min="0"
        stringMode
        onChange={(event) => {
          triggerChange(event ? event.replace(/,/g, '') : '');
        }}
      />
      {children}
    </Input.Group>
  );
}

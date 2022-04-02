import { Typography } from 'antd';
import { PropsWithChildren, useCallback } from 'react';

const ellipse = (parentNode: HTMLDivElement, childNode: HTMLSpanElement, txtNode: HTMLElement) => {
  const childWidth = childNode.offsetWidth;
  const containerWidth = parentNode.offsetWidth;
  const txtWidth = txtNode.offsetWidth;
  const targetWidth = childWidth > txtWidth ? childWidth : txtWidth;

  if (targetWidth > containerWidth) {
    const str = txtNode.textContent as string;
    const txtChars = str.length;
    const avgLetterSize = txtWidth / txtChars;
    const canFit = (containerWidth - (targetWidth - txtWidth)) / avgLetterSize;
    /* eslint-disable no-magic-numbers */
    const delEachSide = (txtChars - canFit + 5) / 2;
    const endLeft = Math.floor(txtChars / 2 - delEachSide);
    const startRight = Math.ceil(txtChars / 2 + delEachSide);
    /* eslint-enable no-magic-numbers */

    txtNode.setAttribute('data-original', txtNode.textContent as string);
    txtNode.textContent = str.slice(0, endLeft) + '...' + str.slice(startRight);
  }
};

interface EllipsisMiddleProps {
  className?: string;
  percent?: number;
  width?: number;
  copyable?: boolean;
}

export function EllipsisMiddle({
  children,
  className,
  width,
  copyable = false,
}: PropsWithChildren<EllipsisMiddleProps>) {
  // eslint-disable-next-line complexity
  const prepEllipse = (node: HTMLDivElement) => {
    const parent = node.parentNode;
    const child = node.childNodes[0];
    let txtToEllipse;

    try {
      txtToEllipse = (parent && parent.querySelector('.ellipseMe')) || child;
    } catch {
      //
    }

    if (child !== null && txtToEllipse) {
      // (Re)-set text back to data-original-text if it exists.
      if ((txtToEllipse as HTMLElement).hasAttribute('data-original')) {
        txtToEllipse.textContent = (txtToEllipse as HTMLElement).getAttribute('data-original');
      }

      ellipse(
        // Use the smaller width.
        (node.offsetWidth > (parent as HTMLElement).offsetWidth ? parent : node) as HTMLDivElement,
        child as HTMLSpanElement,
        txtToEllipse as HTMLElement
      );
    }
  };

  const measuredParent = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      window.addEventListener('resize', () => {
        prepEllipse(node);
      });
      prepEllipse(node);
    }
  }, []);

  return (
    <div
      ref={measuredParent}
      style={{
        wordBreak: 'keep-all',
        overflowWrap: 'normal',
        ...(width && { width }),
      }}
      className={`${className}`}
    >
      <Typography.Text copyable={copyable} style={{ color: 'inherit' }} className="ellipseMe whitespace-nowrap">
        {children}
      </Typography.Text>
    </div>
  );
}

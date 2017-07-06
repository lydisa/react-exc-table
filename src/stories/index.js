import React from 'react';
import { storiesOf } from '@kadira/storybook';
import SouTable from '../index';
import '../../SouTable.css';

storiesOf('SouTable', module)
  .add('default view', () => (
    <SouTable tableHeaders={[{
      title: "采购单号"
    }, {
      title: "品名"
    }, {
      title: "款式"
    }, {
      title: "尺寸(CM)",
      sub: [
        { title: "长" },
        { title: "宽" },
        { title: "高" }
      ]
    }, {
      title: "纸箱数量"
    }, {
      title: "用料",
      headerRender: renderFunc,
      isHeaderButton: true,
      sub: [
        { title: "纸度", disabled: true, onDoubleClick: doubleClick, cellColspan: 4, innerTable: true, className: 'no-pad' },
        { title: "纸长",onDoubleClick: doubleClick},
        { title: "纸板数量",onDoubleClick: doubleClick },
        { title: "接驳方式",onDoubleClick: doubleClick },
      ]
    },
    {
      title: "备注"
    }]
    }
      minTableCol={8}
      width={1200} height={261}
      />
  ))
  .add('scrollable view', () => (
    <SouTable minTableCol={15} minTableRow={60} width={603} height={561} />
  ))
  .add('styled cell view', () => (
    <SouTable

      width={603}
      height={561}
      minCellWidth={70}
      cellHeight={40}
      tableHeaders={[{
        title: "采购单号"
      }, {
        title: "品名"
      }, {
        title: "款式"
      }, {
        title: "尺寸(CM)",
        sub: [
          { title: "长" },
          { title: "宽" },
          { title: "高" }
        ]
      }, {
        title: "纸箱数量"
      }, {
        title: "用料",
        sub: [
          { title: "纸度" },
          { title: "纸长" }
        ]
      },
      { title: "纸板数量" },
      {
        title: "备注"
      }]
      }
      />
  ));
function renderFunc() {
  return <a>计算用料</a>
}

function doubleClick(callback) {
  alert("open the window");
  if (typeof callback === 'function') {
    callback("hahahaha");
  }
}

function renderSubTable(col, row) {
  return (<table className='inner-table sou-table'>
    <tbody>
      <tr>
        <td>a</td>
        <td>a</td>
        <td>a</td>
        <td>a</td>
      </tr>
      <tr>
        <td>b</td>
        <td>b</td>
        <td>b</td>
        <td>b</td>
      </tr>
    </tbody>
  </table>)
}

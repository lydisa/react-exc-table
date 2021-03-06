import React, { Component, PropTypes } from 'react';

class SouTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      tableData: {
        past:[],
        present:props.tableData,
        future:[]
      },
      tableCol: Math.max(props.minTableCol, props.tableData.length),
      tableHeaders: props.tableHeaders,
      tableHeaderRows: undefined,
      tableRow: Math.max(props.minTableRow, props.tableData.length > 0 ? props.tableData[0].length : 0),
      colIndex: undefined,
      rowIndex: undefined,
      headerLeafs: undefined,
      endColIndex: undefined,
      endRowIndex: undefined,
      dragColIndex: undefined,
      dragRowIndex: undefined,
      inputValue: '',
      isTyping: false,
      isContextMenuHidden: true,
      isDragging: false,
      innerClipboardData: undefined,
    };
    this.onContextMenu = this.onContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
    this.selectCell = this.selectCell.bind(this);
    this.selectNextCell = this.selectNextCell.bind(this);
    this.showEmptyInput = this.showEmptyInput.bind(this);
    this.showInput = this.showInput.bind(this);
    this.onChangeInputValue = this.onChangeInputValue.bind(this);
    this.onInputKeyPress = this.onInputKeyPress.bind(this);
    this.onInputKeyDown = this.onInputKeyDown.bind(this);
    this.trimData = this.trimData.bind(this);
    this.updateTable = this.updateTable.bind(this);
    this.getTableDataForPaste = this.getTableDataForPaste.bind(this);
    this.updateTableOnPaste = this.updateTableOnPaste.bind(this);
    this.updateTableOnAutoPaste = this.updateTableOnAutoPaste.bind(this);
    this.insertCol = this.insertCol.bind(this);
    this.insertRow = this.insertRow.bind(this);
    this.deleteCol = this.deleteCol.bind(this);
    this.deleteRow = this.deleteRow.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onGripMouseDown = this.onGripMouseDown.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.copy = this.copy.bind(this);
    this.clearCells = this.clearCells.bind(this);
    this.cut = this.cut.bind(this);
    this.paste = this.paste.bind(this);
    this.onCopy = this.onCopy.bind(this);
    this.onCut = this.onCut.bind(this);
    this.onPaste = this.onPaste.bind(this);
    this.getSwitchedTableData = this.getSwitchedTableData.bind(this);
    this.switchColRow = this.switchColRow.bind(this);
    this.sort = this.sort.bind(this);
    this.onLeftHeaderScroll = this.onLeftHeaderScroll.bind(this);
    this.onTopHeaderScroll = this.onTopHeaderScroll.bind(this);
    this.onInnerTableScroll = this.onInnerTableScroll.bind(this);
    this.styleTable = this.styleTable.bind(this);
    this.renderBorders = this.renderBorders.bind(this);
    this.styleBorders = this.styleBorders.bind(this);
    this.renderContext = this.renderContext.bind(this);
    this.renderHeader = this.renderHeader.bind(this);
    this.renderInnerTable = this.renderInnerTable.bind(this);
    this.getOffset = this.getOffset.bind(this);
    this.nextTableData = this.nextTableData.bind(this);
    this.undoTableData = this.undoTableData.bind(this);
    this.redoTableData = this.redoTableData.bind(this);

    let tableHeaderRows = [];
    if (this.state.tableHeaders && this.state.tableHeaders.length > 0) {
      //表头嵌套判断
      let headerLeafs = [];
      this.createHeader(this.state.tableHeaders, 0, tableHeaderRows, null, headerLeafs);
      //填充普通header
      let firstHeaderRow = tableHeaderRows[0];
      let startIndex = 0;
      for (let i = 0; i < firstHeaderRow.length; i++) {
        startIndex += firstHeaderRow[i].colSpan;
      }
      for (let i = startIndex; i < this.state.tableCol; i++) {
        let emptyCol = {
          parHeader: null,
          colSpan: 1,
          rowSplit: 1
        }
        firstHeaderRow.push(emptyCol);
        headerLeafs.push(emptyCol);
      }
      //选出无子节点的header 用于表格对齐
      let index = 0;
      for (let i = 0; i < tableHeaderRows.length; i++)
        for (let j = 0; j < tableHeaderRows[i].length; j++) {
          tableHeaderRows[i][j].rowIndex = i;
          tableHeaderRows[i][j].colIndex = j;
          tableHeaderRows[i][j].index = index;
          index++;
        }
      this.state.tableHeaderRows = tableHeaderRows;
      this.state.headerLeafs = headerLeafs;
    } else {
      tableHeaderRows.push([]);
      for (let i = 0; i < this.state.tableCol; i++) {
        tableHeaderRows[0].push({
          parHeader: null,
          colSpan: 1,
          rowSplit: 1,
          rowIndex: 1,
          colIndex: i,
          index: i
        })
      }
      this.state.tableHeaderRows = tableHeaderRows;
      this.state.headerLeafs = tableHeaderRows[0];
    }
    for (let i = 0; i < this.state.headerLeafs.length; i++) {
      this.state.headerLeafs[i].leafIndex = i;
    }
    if (this.state.headerLeafs.length > this.state.tableCol) {
      this.state.tableCol = this.state.headerLeafs.length
    }

  }

nextTableData(data){
  const tableData = this.state.tableData;
  const newPast = [...tableData.past,tableData.present];
  return {
    past:newPast,
    present:data,
    future:[]
  }
}


  componentDidMount() {
    this.styleTable();
  }

  componentWillReceiveProps(nextProps) {
    const tableCol = Math.max(nextProps.minTableCol, nextProps.tableData.length, this.state.tableCol);
    const tableRow = Math.max(nextProps.minTableRow,
      nextProps.tableData.length > 0 ? nextProps.tableData[0].length : 0, this.state.tableRow);
    this.setState({
      tableData: this.nextTableData(nextProps.tableData),
      tableCol,
      tableRow,
    });
  }

  componentDidUpdate() {
    if (this.state.colIndex !== undefined) {
      this.styleBorders();
    }
    this.styleTable();

  }

  onContextMenu(e) {
    e.preventDefault();
    const target = e.target;
    const wrapperRect = this.wrapper.getBoundingClientRect();
    let contextMenuState = {
      xPos: e.clientX - wrapperRect.left,
      yPos: e.clientY - wrapperRect.top,
      isContextMenuHidden: false,
    };
    if (target.tagName === 'TD' || target.tagName === 'TH') {
      if (target.className === 'sou-selected-cell ') {
        this.setState(contextMenuState);
      } else {
        this.selectCell(target, Object.assign({}, this.mouseDownState, contextMenuState));
      }
    } else if (e.target.tagName === 'INPUT') {
      this.setState(contextMenuState);
    }
    this.mouseDownState = undefined;
  }

  hideContextMenu() {
    this.setState({
      isContextMenuHidden: true,
    });
  }

  selectCell(td, additionalState) {
    if (this.state.isTyping) {
      this.updateTable(this.state.inputValue);
    }
    const inputValue = td.textContent;
    this.setState(Object.assign({
      inputValue,
      isTyping: false,
      isContextMenuHidden: true,
      isMultiSelecting: false,
      isDragging: false,
      endColIndex: undefined,
      endRowIndex: undefined,
      dragColIndex: undefined,
      dragRowIndex: undefined,
    }, additionalState), () => this.input.select());
  }

  selectNextCell(v, h) {
    let { tableCol, tableRow, colIndex, rowIndex } = this.state;
    if (h !== 0) {
      colIndex = h === -1 ? Math.max(colIndex + h, 0) : Math.min(colIndex + h, tableCol - 1);
    }
    if (v !== 0) {
      rowIndex = v === -1 ? Math.max(rowIndex + v, 0) : Math.min(rowIndex + v, tableRow - 1);
    }
    const nextTd = this.table.querySelector(`[data-col='${colIndex}'][data-row='${rowIndex}']`);
    this.selectCell(nextTd, { colIndex, rowIndex });
  }

  showEmptyInput() {
    let {colIndex, rowIndex, headerLeafs} = this.state;
    if (headerLeafs[colIndex].disabled) {
      return;
    }
    this.setState({
      inputValue: '',
      isTyping: true,
      isContextMenuHidden: true,
    });
  }

  showInput() {
    let {colIndex, rowIndex, headerLeafs} = this.state;
    if (headerLeafs[colIndex].disabled) {
      return;
    }
    this.input.selectionStart = this.input.selectionEnd;
    this.setState({
      isTyping: true,
      isContextMenuHidden: true,
    });
  }

  onChangeInputValue() {
    const inputValue = this.input.value;
    this.setState({ inputValue });
  }

  onInputKeyPress(e) {
    if (!this.state.isTyping) {
      if (e.key === 'Enter') {
        this.showInput();
      } else {
        this.showEmptyInput();
      }
    } else {
      if (e.key === 'Enter') {
        this.selectNextCell(1, 0);
      }
    }
  }

  onInputKeyDown(e) {
    if (!this.state.isContextMenuHidden) {
      this.hideContextMenu();
    }
    if (!this.state.isTyping) {
      switch (e.key) {
        case 'Backspace':
          if (this.state.endColIndex === undefined) {
            this.updateTable('');
          } else {
            this.clearCells();
          }
          break;
        case 'ArrowUp':
          this.selectNextCell(-1, 0);
          break;
        case 'ArrowDown':
          this.selectNextCell(1, 0);
          break;
        case 'ArrowLeft':
          this.selectNextCell(0, -1);
          break;
        case 'ArrowRight':
          this.selectNextCell(0, 1);
          break;
        case 'Tab':
          e.preventDefault();
          this.selectNextCell(0, 1);
          break;
        default:
          break;
      }
    }
  }

  trimData(tableData) {
    const tableDataCol = tableData.length;
    const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
    const newTableData = [];
    let newTableDataCol = tableDataCol;
    let newTableDataRow = tableDataRow;

    for (let i = newTableDataCol - 1; i >= 0; i--) {
      if (tableData[i].every(datum => datum === '')) {
        newTableDataCol--;
      } else {
        break;
      }
    }
    loop: {
      for (let j = newTableDataRow - 1; j >= 0; j--) {
        for (let i = 0; i < tableDataCol; i++) {
          if (tableData[i][j] !== '') {
            break loop;
          }
        }
        newTableDataRow--;
      }
    }

    for (let i = 0; i < newTableDataCol; i++) {
      newTableData[i] = tableData[i].slice(0, newTableDataRow);
    }
    return newTableData;
  }

  updateTable(value) {
    const {colIndex, rowIndex } = this.state;
    const tableData = this.state.tableData.present;
    const newTableData = [];
    const tableDataCol = tableData.length;
    const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
    let newTableDataCol = Math.max(colIndex + 1, tableDataCol);
    let newTableDataRow = Math.max(rowIndex + 1, tableDataRow);

    for (let i = 0; i < newTableDataCol; i++) {
      newTableData[i] = [];
      for (let j = 0; j < newTableDataRow; j++) {
        if (i === colIndex && j === rowIndex) {
          newTableData[i][j] = value;
        } else if (i < tableDataCol && j < tableDataRow) {
          newTableData[i][j] = tableData[i][j];
        } else {
          newTableData[i][j] = '';
        }
      }
    }

    const trimmedTableData = this.trimData(newTableData);
    this.setState({
      tableData: this.nextTableData(trimmedTableData),
    });
    this.props.getData(trimmedTableData);
  }

  getTableDataForPaste(pasteData, pasteColIndex, pasteRowIndex) {
    const tableData  = this.state.tableData.present;
    const newTableData = [];
    const tableDataCol = tableData.length;
    const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
    const pasteDataCol = pasteData.length > 0 ? pasteData[0].length : 0;
    const pasteDataRow = pasteData.length;
    let newTableDataCol = Math.max(pasteColIndex + pasteDataCol, tableDataCol);
    let newTableDataRow = Math.max(pasteRowIndex + pasteDataRow, tableDataRow);

    for (let i = 0; i < newTableDataCol; i++) {
      newTableData[i] = [];
      for (let j = 0; j < newTableDataRow; j++) {
        if (i >= pasteColIndex && i < pasteColIndex + pasteDataCol
          && j >= pasteRowIndex && j < pasteRowIndex + pasteDataRow) {
          newTableData[i][j] = pasteData[j - pasteRowIndex][i - pasteColIndex];
        } else if (i < tableDataCol && j < tableDataRow) {
          newTableData[i][j] = tableData[i][j];
        } else {
          newTableData[i][j] = '';
        }
      }
    }

    return this.trimData(newTableData);
  }

  updateTableOnPaste(data, selectAfterPaste = true) {
    const { colIndex, rowIndex, endColIndex, endRowIndex } = this.state;
    const dataCol = data[0].length;
    const dataRow = data.length;
    let pasteData = data;
    if (dataRow === 1 && dataCol === 1 && endColIndex === undefined) {
      // 1 to 1 copy-paste
      this.updateTable(pasteData[0][0]);
    } else {
      // 1 to n, n to 1, n to n copy-paste

      // step 1-1: get paste cells
      // n to 1 as default
      let pasteColIndex = colIndex, pasteRowIndex = rowIndex,
        selectCol = 1, selectRow = 1,
        pasteCol = dataCol, pasteRow = dataRow;
      if (endColIndex !== undefined) {
        // 1 to n, n to n
        pasteColIndex = Math.min(colIndex, endColIndex);
        pasteRowIndex = Math.min(rowIndex, endRowIndex);
        selectCol = Math.abs(endColIndex - colIndex) + 1;
        selectRow = Math.abs(endRowIndex - rowIndex) + 1;
        pasteCol = Math.max(dataCol, selectCol);
        pasteRow = Math.max(dataRow, selectRow);
        if (selectCol > dataCol || selectRow > dataRow) {
          // step 1-2: get paste data if select area larger than data,
          pasteData = [];
          for (let i = 0; i < pasteRow; i++) {
            pasteData[i] = [];
            for (let j = 0; j < pasteCol; j++) {
              pasteData[i][j] = data[i % dataRow][j % dataCol];
            }
          }
        }
      }

      // step 2: get new table data
      const trimmedData = this.getTableDataForPaste(pasteData, pasteColIndex, pasteRowIndex);
      this.props.getData(trimmedData);

      // step 3: select cells and expand table after paste
      if (selectAfterPaste) {
        const pasteTd = this.table.querySelector(`[data-col='${pasteColIndex}'][data-row='${pasteRowIndex}']`);
        const pasteEndColIndex = pasteColIndex + pasteCol - 1;
        const pasteEndRowIndex = pasteRowIndex + pasteRow - 1;
        this.selectCell(pasteTd, {
          tableData: this.nextTableData(trimmedData),
          tableCol: Math.max(this.state.tableCol, trimmedData.length),
          tableRow: Math.max(this.state.tableRow, trimmedData.length > 0 ? trimmedData[0].length : 0),
          colIndex: pasteColIndex,
          rowIndex: pasteRowIndex,
          endColIndex: pasteEndColIndex,
          endRowIndex: pasteEndRowIndex,
          innerClipboardData: data,
        });
      } else {
        this.setState({
          tableData: this.nextTableData(trimmedData),
          tableCol: Math.max(this.state.tableCol, trimmedData.length),
          tableRow: Math.max(this.state.tableRow, trimmedData.length > 0 ? trimmedData[0].length : 0),
        });
      }
    }
  }

  updateTableOnAutoPaste() {
    // step 1: get paste and select cells
    const { colIndex, rowIndex, endColIndex, endRowIndex, dragColIndex, dragRowIndex } = this.state;
    let pasteColIndex, pasteRowIndex,
      pasteCol = 1, pasteRow = 1,
      selectColIndex, selectRowIndex, selectEndColIndex, selectEndRowIndex;
    if (endColIndex === undefined) {
      if (dragRowIndex === rowIndex) {
        // drag in row
        pasteRowIndex = rowIndex;
        pasteCol = Math.abs(dragColIndex - colIndex);
        selectRowIndex = rowIndex;
        selectEndRowIndex = rowIndex;
        if (dragColIndex > colIndex) {
          // drag right
          pasteColIndex = colIndex + 1;
          selectColIndex = colIndex;
          selectEndColIndex = dragColIndex;
        } else {
          // drag left
          pasteColIndex = dragColIndex;
          selectColIndex = dragColIndex;
          selectEndColIndex = colIndex;
        }
      } else {
        // drag in col
        pasteColIndex = colIndex;
        pasteRow = Math.abs(dragRowIndex - rowIndex);
        selectColIndex = colIndex;
        selectEndColIndex = colIndex;
        if (dragRowIndex < rowIndex) {
          // drag up
          pasteRowIndex = dragRowIndex;
          selectRowIndex = dragRowIndex;
          selectEndRowIndex = rowIndex;
        } else {
          // drag down
          pasteRowIndex = rowIndex + 1;
          selectRowIndex = rowIndex;
          selectEndRowIndex = dragRowIndex;
        }
      }
    } else {
      const minColIndex = Math.min(colIndex, endColIndex);
      const maxColIndex = Math.max(colIndex, endColIndex);
      const minRowIndex = Math.min(rowIndex, endRowIndex);
      const maxRowIndex = Math.max(rowIndex, endRowIndex);
      pasteCol = Math.abs(endColIndex - colIndex) + 1;
      pasteRow = Math.abs(endRowIndex - rowIndex) + 1;
      if (dragRowIndex <= maxRowIndex && dragRowIndex >= minRowIndex) {
        // drag in row
        pasteRowIndex = minRowIndex;
        selectRowIndex = minRowIndex;
        selectEndRowIndex = maxRowIndex;
        if (dragColIndex > maxColIndex) {
          // drag right
          pasteColIndex = maxColIndex + 1;
          pasteCol = dragColIndex - maxColIndex;
          selectColIndex = minColIndex;
          selectEndColIndex = dragColIndex;
        } else {
          // drag left
          pasteColIndex = dragColIndex;
          pasteCol = minColIndex - dragColIndex;
          selectColIndex = dragColIndex;
          selectEndColIndex = maxColIndex;
        }
      } else {
        // drag in col
        pasteColIndex = minColIndex;
        selectColIndex = minColIndex;
        selectEndColIndex = maxColIndex;
        if (dragRowIndex < minRowIndex) {
          // drag up
          pasteRowIndex = dragRowIndex;
          pasteRow = minRowIndex - dragRowIndex;
          selectRowIndex = dragRowIndex;
          selectEndRowIndex = maxRowIndex;
        } else {
          // drag down
          pasteRowIndex = maxRowIndex + 1;
          pasteRow = dragRowIndex - maxRowIndex;
          selectRowIndex = minRowIndex;
          selectEndRowIndex = dragRowIndex;
        }
      }
    }

    // step 2: get paste data
    const copyData = this.copy(false);
    const dataCol = copyData[0].length;
    const dataRow = copyData.length;
    const pasteData = [];
    for (let i = 0; i < pasteRow; i++) {
      pasteData[i] = [];
      for (let j = 0; j < pasteCol; j++) {
        pasteData[i][j] = copyData[i % dataRow][j % dataCol];
      }
    }

    // step 3: get new table data
    const trimmedData = this.getTableDataForPaste(pasteData, pasteColIndex, pasteRowIndex);
    this.props.getData(trimmedData);

    // step 4: select cells after paste
    const selectTd = this.table.querySelector(`[data-col='${selectColIndex}'][data-row='${selectRowIndex}']`);
    this.selectCell(selectTd, {
      tableData: this.nextTableData(trimmedData),
      colIndex: selectColIndex,
      rowIndex: selectRowIndex,
      endColIndex: selectEndColIndex,
      endRowIndex: selectEndRowIndex,
    });
  }

  insertCol(d) {
    return () => {
      const {tableCol, colIndex } = this.state;
      const tableData =this.state.tableData.present;
      if (colIndex + d < tableData.length) {
        const emptyCol = [];
        for (let i = 0; i < tableData.length + 1; i++) {
          emptyCol.push('');
        }
        tableData.splice(colIndex + d, 0, emptyCol);
        this.setState({
          tableData,
          tableCol: tableCol + 1,
        });
        this.props.getData(tableData);
      } else {
        this.setState({
          tableCol: tableCol + 1,
        });
      }
    };
  }

  insertRow(d) {
    return () => {
      const {tableRow, rowIndex } = this.state;
      tableData = this.state.tableData.present;
      const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
      if (rowIndex + d < tableDataRow) {
        for (let i = 0; i < tableData.length; i++) {
          tableData[i].splice(rowIndex + d, 0, '');
        }
        this.setState({
          tableData:this.nextTableData(tableData),
          tableRow: tableRow + 1,
        });
        this.props.getData(tableData);
      } else {
        this.setState({
          tableRow: tableRow + 1,
        });
      }
    };
  }

  deleteCol() {
    const { tableCol, colIndex } = this.state;
    const tableData = this.state.tableData.present;
    if (colIndex < tableData.length) {
      tableData.splice(colIndex, 1);
      this.setState({
        tableData,
        tableCol: tableCol > this.props.minTableCol ? tableCol - 1 : tableCol,
      });
      this.props.getData(tableData);
    } else {
      this.setState({
        tableCol: tableCol > this.props.minTableCol ? tableCol - 1 : tableCol,
      });
    }
  }

  deleteRow() {
    const { tableRow, rowIndex } = this.state;
    const tableData = this.state.tableData;
    const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
    if (rowIndex < tableDataRow) {
      for (let i = 0; i < tableData.length; i++) {
        tableData[i].splice(rowIndex, 1);
      }
      this.setState({
        tableData,
        tableRow: tableRow > this.props.minTableRow ? tableRow - 1 : tableRow,
      });
      this.props.getData(tableData);
    } else {
      this.setState({
        tableRow: tableRow > this.props.minTableRow ? tableRow - 1 : tableRow,
      });
    }
  }

  onMouseDown(e) {
    e.preventDefault();
    let target = e.target;
    let colIndex = Number(target.getAttribute('data-col'));
    let rowIndex = Number(target.getAttribute('data-row'));
    let innerColIndex = target.getAttribute('data-inner-col') ? Number(target.getAttribute('data-inner-col')) : null;
    let innerRowIndex = target.getAttribute('data-inner-row') ? Number(target.getAttribute('data-inner-row')) : null;
    if ((target.tagName === 'TD' || target.tagName === 'TH') && !(rowIndex === -1 && colIndex === -1)) {
      const { tableCol, tableRow } = this.state;
      let endColIndex = undefined;
      let endRowIndex = undefined;
      let endInnerColIndex = undefined;
      let endInnerRowIndex = undefined;
      let isMultiSelecting = false;
      //点击行号时选取整行
      if (rowIndex > -1 && colIndex === -1) {
        colIndex = 0;
        endColIndex = tableCol - 1;
        endRowIndex = rowIndex;
        isMultiSelecting = 'row';
        //点击表头时选取整列
      } else if (rowIndex <= -1 && colIndex !== -1) {
        const {tableHeaderRows} = this.state;
        let leafs = this.getLeafs(tableHeaderRows[-rowIndex - 1][colIndex])
        rowIndex = 0;
        colIndex = leafs[0].leafIndex;
        endColIndex = leafs[leafs.length - 1].leafIndex;
        endRowIndex = tableRow - 1;
        isMultiSelecting = 'col';
      }

      this.mouseDownState = {
        colIndex,
        rowIndex,
        innerColIndex,
        innerRowIndex,
        endColIndex,
        endRowIndex,
        endInnerColIndex,
        endInnerRowIndex,
        isMultiSelecting,
      };
      if (e.button === 0) {
        this.selectCell(target, this.mouseDownState);
      }
    }
  }

  onGripMouseDown(e) {
    e.preventDefault();
    this.setState({
      isDragging: true,
    });
  }

  onMouseOver(e) {
    e.preventDefault();
    const target = e.target;
    if ((target.tagName === 'TD' || target.tagName === 'TH')) {
      const targetColIndex = Number(target.getAttribute('data-col'));
      const targetRowIndex = Number(target.getAttribute('data-row'));
      const targetInnerColIndex = target.getAttribute('data-inner-col') ? Number(target.getAttribute('data-inner-col')) : undefined;
      const targetInnerRowIndex = target.getAttribute('data-inner-row') ? Number(target.getAttribute('data-inner-row')) : undefined;
      if (this.mouseDownState !== undefined) {
        const { tableCol, tableRow } = this.state;
        const isMultiSelecting = this.state.isMultiSelecting;
        const endColIndex = isMultiSelecting === 'row' ? tableCol - 1 : Math.max(targetColIndex, 0);
        const endRowIndex = isMultiSelecting === 'col' ? tableRow - 1 : Math.max(targetRowIndex, 0);
        if (!isMultiSelecting) {
          this.setState({
            isMultiSelecting: true,
            endColIndex,
            endRowIndex,
            endInnerColIndex: targetInnerColIndex,
            endInnerRowIndex: targetInnerRowIndex
          });
        } else if (endColIndex === this.state.colIndex && endRowIndex === this.state.rowIndex) {
          this.setState({
            isMultiSelecting: false,
            endColIndex: undefined,
            endRowIndex: undefined,
            endInnerColIndex: targetInnerColIndex,
            endInnerRowIndex: targetInnerRowIndex
          });
        } else {
          this.setState({
            endColIndex,
            endRowIndex,
            endInnerColIndex: targetInnerColIndex,
            endInnerRowIndex: targetInnerRowIndex
          });
        }
      } else if (this.state.isDragging) {
        const { colIndex, rowIndex, endColIndex, endRowIndex, innerColIndex, innerRowIndex, endInnerColIndex, endInnerRowIndex } = this.state;
        const willAutoPaste = endColIndex === undefined
          ? !(targetColIndex === colIndex && targetRowIndex === rowIndex)
          : !(targetColIndex <= Math.max(colIndex, endColIndex) && targetColIndex >= Math.min(colIndex, endColIndex)
            && targetRowIndex <= Math.max(rowIndex, endRowIndex) && targetRowIndex >= Math.min(rowIndex, endRowIndex));
        if (willAutoPaste) {
          this.setState({
            dragColIndex: targetColIndex,
            dragRowIndex: targetRowIndex,
          });
        } else {
          this.setState({
            dragColIndex: undefined,
            dragRowIndex: undefined,
          });
        }
      }
    }
  }

  onMouseUp(e) {
    e.preventDefault();
    if (this.mouseDownState !== undefined) {
      this.setState({
        isMultiSelecting: false,
      });
      this.mouseDownState = undefined;
    } else if (this.state.isDragging && this.state.dragColIndex !== undefined) {
      this.updateTableOnAutoPaste();
    } else if (this.state.isDragging) {
      this.setState({
        isDragging: false,
      })
    }
  }

  copy(toClipboard = true) {
    const { colIndex, rowIndex } = this.state;
    const tableData = this.state.tableData.present;
    let { endColIndex, endRowIndex } = this.state;
    if (endColIndex === undefined) {
      endColIndex = colIndex;
      endRowIndex = rowIndex;
    }
    const minCol = Math.min(colIndex, endColIndex);
    const maxCol = Math.max(colIndex, endColIndex);
    const minRow = Math.min(rowIndex, endRowIndex);
    const maxRow = Math.max(rowIndex, endRowIndex);
    const data = [];
    for (let i = minRow; i <= maxRow; i++) {
      data[i - minRow] = [];
      for (let j = minCol; j <= maxCol; j++) {
        if (tableData[j] !== undefined && tableData[j][i] !== undefined) {
          data[i - minRow][j - minCol] = tableData[j][i];
        } else {
          data[i - minRow][j - minCol] = '';
        }
      }
    }
    if (toClipboard) {
      this.setState({
        innerClipboardData: data,
      });
    }
    return data;
  }

  clearCells() {
    const emptyCol = Math.abs(this.state.colIndex - this.state.endColIndex) || 0;
    const emptyRow = Math.abs(this.state.rowIndex - this.state.endRowIndex) || 0;
    const emptyData = [];
    for (let i = 0; i <= emptyRow; i++) {
      emptyData[i] = [];
      for (let j = 0; j <= emptyCol; j++) {
        emptyData[i][j] = '';
      }
    }
    this.updateTableOnPaste(emptyData, false);
  }

  cut() {
    this.copy();
    this.clearCells();
  }

  paste() {
    this.updateTableOnPaste(this.state.innerClipboardData);
  }

  onCopy(e) {
    // will update innerClipboardData in copy
    e.preventDefault();
    const data = this.copy();
    const dataCol = data[0].length;
    let rawData = '';
    data.forEach((row, rowIndex) => {
      row.forEach((datum, colIndex) => {
        let tail = '\t';
        if (colIndex === dataCol - 1) {
          tail = rowIndex === data.length - 1 ? '' : '\n';
        }
        rawData += datum + tail;
      });
    });
    e.clipboardData.setData('text/plain', rawData);
  }

  onCut(e) {
    // will update innerClipboardData in onCopy
    e.preventDefault();
    this.onCopy(e);
    this.clearCells();
  }

  onPaste(e) {
    // will update innerClipboardData in updateTableOnPaste
    e.preventDefault();
    const rawData = e.clipboardData.getData('Text');
    const data = [];
    rawData.split('\n').forEach((row, index) => {
      data[index] = row.split('\t');
    });
    this.updateTableOnPaste(data);
  }

  getSwitchedTableData(tableData = this.state.tableData.present) {
    const switchedTableData = [];
    const tableDataCol = tableData.length;
    const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
    for (let i = 0; i < tableDataRow; i++) {
      switchedTableData[i] = [];
      for (let j = 0; j < tableDataCol; j++) {
        switchedTableData[i][j] = tableData[j][i];
      }
    }
    return switchedTableData;
  }

  switchColRow() {
    const tableData = this.state.tableData.present;
    const tableDataCol = tableData.length;
    const tableDataRow = tableData.length > 0 ? tableData[0].length : 0;
    const newTableData = this.getSwitchedTableData();
    const tableCol = Math.max(this.props.minTableCol, tableDataRow, this.state.tableCol);
    const tableRow = Math.max(this.props.minTableRow, tableDataCol, this.state.tableRow);
    this.setState({
      tableData: this.nextTableData(newTableData),
      tableCol,
      tableRow,
    });
    this.props.getData(newTableData);
  }

  sort(inverse = false) {
    return () => {
      const { colIndex } = this.state;
      const switchedTableData = this.getSwitchedTableData();
      const firstRow = switchedTableData[0];
      const restRows = switchedTableData.slice(1);
      if (inverse) {
        restRows.sort((a, b) => {
          if (!isNaN(+a[colIndex]) && !isNaN(+b[colIndex])) {
            return b[colIndex] - a[colIndex];
          }
          if (b[colIndex] < a[colIndex]) {
            return -1;
          }
          if (b[colIndex] > a[colIndex]) {
            return 1;
          }
          return 0;
        });
      } else {
        restRows.sort((a, b) => {
          if (!isNaN(+a[colIndex]) && !isNaN(+b[colIndex])) {
            return a[colIndex] - b[colIndex];
          }
          if (a[colIndex] < b[colIndex]) {
            return -1;
          }
          if (a[colIndex] > b[colIndex]) {
            return 1;
          }
          return 0;
        });
      }
      const sortedTableData = this.getSwitchedTableData([firstRow].concat(restRows));
      this.setState({
        tableData: this.nextTableData(sortedTableData),
      });
      this.props.getData(sortedTableData);
    };
  }

  onLeftHeaderScroll() {
    const {tableHeaderRows} = this.state;
    const scrollTop = this.leftHeader.scrollTop;
    if (this.scrollTop !== scrollTop) {
      this.scrollTop == scrollTop;
      this.innerTable.scrollTop = scrollTop;
      if (scrollTop > 0) {
        this.topHeader.style.height = (this.props.cellHeight * tableHeaderRows.length + 1) + 'px';
        this.innerTable.style.marginTop = '-1px';
        this.leftHeaderHead.style.height = (this.props.cellHeight * tableHeaderRows.length + 1) + 'px';
      } else {
        this.topHeader.style.height = this.props.cellHeight * tableHeaderRows.length + 'px';
        this.innerTable.style.marginTop = 0;
        this.leftHeaderHead.style.height = this.props.cellHeight * tableHeaderRows.length + 'px';
      }
    }
  }

  onTopHeaderScroll() {
    const scrollLeft = this.topHeader.scrollLeft;
    if (this.scrollLeft !== scrollLeft) {
      this.scrollLeft = scrollLeft;
      this.innerTable.scrollLeft = scrollLeft;
      if (scrollLeft > 0) {
        this.leftWrapper.style.width = (this.props.minCellWidth + 1) + 'px';
      } else {
        this.leftWrapper.style.width = this.props.minCellWidth + 'px';
      }
    }
  }

  onInnerTableScroll() {
    const {tableHeaderRows} = this.state;
    const scrollTop = this.innerTable.scrollTop;
    const scrollLeft = this.innerTable.scrollLeft;
    if (this.scrollTop !== scrollTop) {
      this.scrollTop = scrollTop;
      this.leftHeader.scrollTop = scrollTop;
      if (scrollTop > 0) {
        this.topHeader.style.height = (this.props.cellHeight * tableHeaderRows.length + 1) + 'px';
        this.innerTable.style.marginTop = '-1px';
        this.leftHeaderHead.style.height = (this.props.cellHeight * tableHeaderRows.length + 1) + 'px';
      } else {
        this.topHeader.style.height = this.props.cellHeight * tableHeaderRows.length + 'px';
        this.innerTable.style.marginTop = 0;
        this.leftHeaderHead.style.height = this.props.cellHeight * tableHeaderRows.length + 'px';
      }
    }

    if (this.scrollLeft !== scrollLeft) {
      this.scrollLeft = scrollLeft;
      this.topHeader.scrollLeft = scrollLeft;
      if (scrollLeft > 0) {
        this.leftWrapper.style.width = (this.props.minCellWidth + 1) + 'px';
      } else {
        this.leftWrapper.style.width = this.props.minCellWidth + 'px';
      }
    }
  }

  renderTable() {
    let {tableCol, tableRow, tableHeaders, colIndex, rowIndex, endColIndex, endRowIndex, tableHeaderRows, headerLeafs} = this.state;
    const tableData = this.state.tableData.present;
    let showHeader = false;
    const { width, height, minCellWidth, cellHeight } = this.props;

    const cellStyle = {
      minWidth: minCellWidth + 'px',
      height: cellHeight + 'px',
      whiteSpace: 'nowrap',
    };
    const leftHeaderRows = [];
    for (let j = 0; j < tableRow; j++) {
      const isRowIncluded = endRowIndex !== undefined ? (j >= Math.min(rowIndex, endRowIndex)
        && j <= Math.max(rowIndex, endRowIndex)) : (j === rowIndex);
      leftHeaderRows.push(
        <tr key={j}>
          <td
            style={cellStyle}
            data-col={-1}
            data-row={j}
            className={isRowIncluded ? 'sou-selected-cell-indicator' : ''}
            >
            {j}
          </td>
        </tr>
      );
    }
    const ths = [];
    showHeader = tableHeaders && tableHeaders.length > 0;
    let row = 0;
    for (let headerRow of tableHeaderRows) {
      ths.push([]);
      let isColIncluded = false;
      for (let i = 1; i <= headerRow.length; i++) {
        for (let leaf of this.getLeafs(headerRow[i - 1])) {
          isColIncluded = endColIndex !== undefined ? (leaf.leafIndex >= Math.min(colIndex, endColIndex)
            && leaf.leafIndex <= Math.max(colIndex, endColIndex)) : (leaf.leafIndex === colIndex);
          if (isColIncluded) {
            break;
          }
        }
        ths[ths.length - 1].push(
          <th
            key={i}
            style={cellStyle}
            data-col={i - 1}
            data-row={-row - 1}
            data-inner-table={headerRow[i - 1].innerTable}
            data-cell-colspan={headerRow[i - 1].cellColspan}
            colSpan={headerRow[i - 1].colSpan || 1}
            rowSpan={tableHeaderRows.length - row - headerRow[i - 1].rowSplit + 1 || 1}
            className={(isColIncluded ? 'sou-selected-cell-indicator' : '') + (headerRow[i - 1].isHeaderButton ? ' button-header' : '')}
            >
            {!showHeader && i > 26 && String.fromCharCode(Math.floor((i - 1) / 26) + 64)}
            {!showHeader && String.fromCharCode((i - 1) % 26 + 65)}
            {showHeader && i - 1 < headerRow.length ? this.renderHeader(headerRow[i - 1]) : ""}
          </th>
        );
      }
      row++;
    }

    const rows = [];
    let mergeCount = 0;
    for (let j = 0; j < tableRow; j++) {
      let row = (
        <tr key={j}>
          {headerLeafs.map((col, index) => {
            const isCurrent = index === colIndex && j === rowIndex;
            const isMultiSelected = index >= Math.min(colIndex, endColIndex)
              && index <= Math.max(colIndex, endColIndex)
              && j >= Math.min(rowIndex, endRowIndex)
              && j <= Math.max(rowIndex, endRowIndex);
            if (col.cellColspan) {
              mergeCount = col.cellColspan - 1;
            } else if (mergeCount > 0) {
              mergeCount--;
              return <td style={{ display: 'none' }}></td>;
            }
            return (
              <td
                key={index + 1}
                style={cellStyle}
                data-col={index}
                data-row={j}
                data-rowspan={col.cellColspan}
                className={(isMultiSelected ? 'sou-selected-cell ' : '') + (col.className ? col.className : '')}
                >
                {tableData[index] !== undefined && typeof (tableData[index][j]) !== 'object' ? tableData[index][j] : ''}
                {col.render ? col.render() : ''}
                {tableData[index] !== undefined && this.renderInnerTable(col, tableData[index][j], index, j)}
                {isCurrent && (
                  <input
                    type="text"
                    className="sou-input"
                    style={{ zIndex: this.state.isTyping ? 100 : -100 }}
                    ref={input => this.input = input}
                    value={this.state.inputValue}
                    onChange={this.onChangeInputValue}
                    onKeyPress={this.onInputKeyPress}
                    onKeyDown={this.onInputKeyDown}
                    onDoubleClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onMouseOver={e => e.stopPropagation()}
                    onMouseUp={e => e.stopPropagation()}
                    onMouseLeave={e => e.stopPropagation()}
                    onCopy={this.onCopy}
                    onCut={this.onCut}
                    onPaste={this.onPaste}
                    />
                )}
              </td>
            );
          })}
        </tr>
      );
      rows.push(row);
    }
    return (
      <div>
        <div
          className="left-wrapper"
          style={{
            width: minCellWidth,
          }}
          ref={leftWrapper => this.leftWrapper = leftWrapper}
          >
          <table
            className="sou-table-left-header"
            >
            <thead
              style={{
                height: cellHeight * ths.length + 'px',
              }}
              ref={leftHeaderHead => this.leftHeaderHead = leftHeaderHead}
              >
              <tr>
                <th
                  style={{
                    minWidth: minCellWidth + 'px',
                    height: cellHeight * ths.length + 'px',
                  }}
                  data-col={-1}
                  data-row={-1}
                  onClick={this.switchColRow}
                  onContextMenu={e => e.preventDefault()}
                  >
                  switch
                </th>
              </tr>
            </thead>

            <tbody
              style={{
                marginTop: cellHeight * ths.length,
                height: (height - cellHeight) + 'px',
              }}
              onContextMenu={this.onContextMenu}
              onMouseDown={this.onMouseDown}
              onMouseOver={this.onMouseOver}
              onMouseUp={this.onMouseUp}
              ref={leftHeader => this.leftHeader = leftHeader}
              onScroll={this.onLeftHeaderScroll}
              >
              {leftHeaderRows}
            </tbody>
          </table>
        </div>

        <div className="right-wrapper">
          <div
            className="right-top-wrapper"
            style={{
              width: (width - minCellWidth - 1) + 'px',
              height: cellHeight * ths.length + 'px',
            }}
            ref={topHeader => this.topHeader = topHeader}
            onScroll={this.onTopHeaderScroll}
            >
            <table
              className="sou-table"
              onContextMenu={this.onContextMenu}
              onMouseDown={this.onMouseDown}
              onMouseOver={this.onMouseOver}
              onMouseUp={this.onMouseUp}
              >
              <thead>
                {ths.map(function (headerRow) {
                  return (
                    <tr>
                      {headerRow}
                    </tr>
                  )
                })}
              </thead>
            </table>
          </div>

          <div
            className="right-bottom-wrapper"
            style={{
              width: (width - minCellWidth - 1) + 'px',
              height: (height - cellHeight) + 'px',
            }}
            ref={innerTable => this.innerTable = innerTable}
            onScroll={this.onInnerTableScroll}
            >
            <div className="inner-wrapper">
              <table
                className="sou-table"
                ref={table => this.table = table}
                onContextMenu={this.onContextMenu}
                onMouseDown={this.onMouseDown}
                onMouseOver={this.onMouseOver}
                onMouseUp={this.onMouseUp}
                >
                <tbody
                  onDoubleClick={() => {
                    let {colIndex, rowIndex, headerLeafs} = this.state;
                    if (headerLeafs[colIndex].onDoubleClick) {
                      headerLeafs[colIndex].onDoubleClick(function (result) {
                        alert("finished!" + result);
                      });
                    } else { this.showInput(); }
                  } }
                  >
                  {rows}
                </tbody>
              </table>

              {this.renderBorders()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderHeader(header) {
    if (header.headerRender) {
      return header.headerRender();
    }
    if (header.title) {
      return header.title;
    }
    return '';
  }

  renderInnerTable(col, tableDatas, targetColIndex, targetRowIndex) {
    if (!col.innerTable || !tableDatas) {//||typeof(tableDatas)!=='object'
      return;
    }
    const { width, height, minCellWidth, cellHeight} = this.props;
    const {colIndex, rowIndex,endColIndex,innerColIndex,innerRowIndex,endRowIndex,endInnerRowIndex} = this.state;
    const style = {
      minWidth: minCellWidth + 'px',
      height: cellHeight + 'px'
    }
    const innerTable = [];
    for (let i = 0; i < tableDatas.length; i++) {
      innerTable.push([]);
      let row = (
        <tr>
          {tableDatas[i].map((cell, cellIndex) => {
            const isCurrent = targetColIndex + cellIndex === colIndex && targetRowIndex === rowIndex;
            //console.log("colIndex:"+colIndex+" rowIndex:"+rowIndex+" endColIndex:"+endColIndex+" endRowIndex:"+endRowIndex+ "\ninnerColIndex:"+innerColIndex+" innerRowIndex:"+innerRowIndex+" endInnerRowIndex:"+endInnerRowIndex);
            //console.log(cell+" "+targetRowIndex*1000 +(endInnerRowIndex?i:0)+"  within?---->"+(Number(rowIndex)*1000 +Number(innerRowIndex))+"  and  "+(Number(endRowIndex)*1000+Number(endInnerRowIndex)))
            const isMultiSelected = targetColIndex >= Math.min(colIndex, endColIndex)
              && targetColIndex <= Math.max(colIndex, endColIndex)
              && targetRowIndex >= Math.min(rowIndex, endRowIndex)
              && targetRowIndex <= Math.max(rowIndex, endRowIndex)
              && targetRowIndex*1000 +endInnerRowIndex?i:0 >= Math.min(Number(rowIndex)*1000 +Number(innerRowIndex), Number(endRowIndex)*1000+Number(endInnerRowIndex))
              && targetRowIndex*1000 +endInnerRowIndex?i:0 <= Math.max(Number(rowIndex)*1000 +Number(innerRowIndex), Number(endRowIndex)*1000+Number(endInnerRowIndex))
            return (
              <td
                data-col={targetColIndex + cellIndex}
                data-row={targetRowIndex}
                data-inner-col={cellIndex}
                data-inner-row={i}
                className={(isMultiSelected ? 'sou-selected-cell ' : '')}
                style={style}
                >
                {cell}
                {isCurrent && (
                  <input
                    type="text"
                    className="sou-input"
                    style={{ zIndex: this.state.isTyping ? 100 : -100 }}
                    ref={input => this.input = input}
                    value={this.state.inputValue}
                    onChange={this.onChangeInputValue}
                    onKeyPress={this.onInputKeyPress}
                    onKeyDown={this.onInputKeyDown}
                    onDoubleClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onMouseOver={e => e.stopPropagation()}
                    onMouseUp={e => e.stopPropagation()}
                    onMouseLeave={e => e.stopPropagation()}
                    onCopy={this.onCopy}
                    onCut={this.onCut}
                    onPaste={this.onPaste}
                    />
                )}
              </td>
            )
          })}
        </tr>
      )
      innerTable[i].push(row);
    }
    return (
      <table className='inner-table sou-table'>
        <tbody>
          {innerTable}
        </tbody>
      </table>
    )
  }

  styleTable() {
    const { tableCol, headerLeafs} = this.state;
    const theadTr = document.querySelectorAll('.sou-table:not(.inner-table)  > thead > tr');
    const tbodyTrs = document.querySelectorAll('.sou-table:not(.inner-table)  > tbody > tr');
    const tbodyTr = tbodyTrs[0];
    const ths = theadTr[0].children;
    const thtds = document.querySelectorAll('.sou-table:not(.inner-table) > thead  th');
    const tds = tbodyTr.children;
    theadTr[theadTr.length - 1].style.width = (tbodyTr.offsetWidth + 1) + 'px';
    for (let i = 0; i < headerLeafs.length; i++) {
      //判断是否内嵌表格 
      if (headerLeafs[i].innerTable) {
        const colspan = headerLeafs[i].cellColspan || 1;
        const index = headerLeafs[i].leafIndex;
        for (let j = 0; j < colspan; j++) {
          const header = thtds[headerLeafs[i + j].index]
          const tds = document.querySelectorAll(`.inner-table > tbody > tr:first-child > td[data-col='${index + j}']`);
          //选出最大宽度值后统一所有列宽度
          let maxWidth = header.offsetWidth;
          for (let k = 0; k < tds.length; k++) {
            if (tds[k].offsetWidth > maxWidth) {
              maxWidth = tds[k].offsetWidth;
            }
          }
          header.style.width = maxWidth + 'px';
          for (let k = 0; k < tds.length; k++) {
            tds[k].style.width = maxWidth + 'px';
          }
        }
      }
      //判断是否为多列合并，若为多列合并则需要叠加这几列的宽度 否则只计算一列的宽度
      if (headerLeafs[i].cellColspan > 1) {
        const colspan = headerLeafs[i].cellColspan;
        let totalwidth = 0;
        for (let j = 0; j < colspan; j++) {
          totalwidth += thtds[headerLeafs[i + j].index].offsetWidth;
        }
        tds[i].style.width = totalwidth + 'px';
      } else {
        thtds[headerLeafs[i].index].style.minWidth = tds[i].offsetWidth + 'px';
        if (thtds[headerLeafs[i].index].offsetWidth > tds[i].offsetWidth) {
          tds[i].style.width = thtds[headerLeafs[i].index].offsetWidth + "px";
        }
      }
    }
    //行号style高度调整
    const leftHeaders = document.querySelectorAll('.sou-table-left-header > tbody > tr');
    for (let i = 0; i < leftHeaders.length; i++) {
      leftHeaders[i].children[0].style.height = tbodyTrs[i].offsetHeight + "px";
    }
  }

  renderBorders() {
    return (
      <div
        className="sou-borders"
        onMouseDown={(e) => e.preventDefault()}
        onMouseUp={this.onMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        >
        {this.state.dragColIndex !== undefined && <div className="sou-paste-borders">
          <div />
          <div />
          <div />
          <div />
        </div>}

        {this.state.endColIndex !== undefined && <div className="sou-area-borders">
          <div />
          <div />
          <div />
          <div />
          <div
            className="sou-drag-grip"
            onMouseDown={this.onGripMouseDown}
            />
        </div>}

        {this.state.colIndex !== undefined && <div className="sou-current-borders">
          <div />
          <div />
          <div />
          <div />

          {this.state.endColIndex === undefined && <div
            className="sou-drag-grip"
            onMouseDown={this.onGripMouseDown}
            />}
        </div>}
      </div>
    );
  }

  styleBorders() {
    const { colIndex, rowIndex, endColIndex, endRowIndex, dragColIndex, dragRowIndex, innerColIndex, innerRowIndex, endInnerColIndex, endInnerRowIndex} = this.state;
    let selector = `[data-col='${colIndex}'][data-row='${rowIndex}']`;
    if (innerColIndex) { selector += `[data-inner-col='${innerColIndex}']` }
    if (innerRowIndex) { selector += `[data-inner-row='${innerRowIndex}']` }
    const currentTd = this.table.querySelector(selector);
    let { offsetTop, offsetLeft, offsetWidth, offsetHeight } = this.getOffset(currentTd);
    const currentBorders = document.querySelectorAll('.sou-current-borders > div');
    currentBorders[0].setAttribute('style', `top: ${offsetTop}px; left: ${offsetLeft}px; width: ${offsetWidth}px; height: 2px;`);
    currentBorders[1].setAttribute('style', `top: ${offsetTop}px; left: ${offsetLeft + offsetWidth - 1}px; width: 2px; height: ${offsetHeight}px;`);
    currentBorders[2].setAttribute('style', `top: ${offsetTop + offsetHeight - 1}px; left: ${offsetLeft}px; width: ${offsetWidth}px; height: 2px;`);
    currentBorders[3].setAttribute('style', `top: ${offsetTop}px; left: ${offsetLeft}px; width: 2px; height: ${offsetHeight}px;`);

    let multiSelectOffsetTop, multiSelectOffsetLeft, multiSelectOffsetWidth, multiSelectOffsetHeight,
      autoPasteOffsetTop, autoPasteOffsetLeft, autoPasteOffsetWidth, autoPasteOffsetHeight;

    if (endColIndex !== undefined) {
      let selector = `[data-col='${endColIndex}'][data-row='${endRowIndex}']`;
      if (endInnerColIndex) { selector += `[data-inner-col='${endInnerColIndex}']` }
      if (endInnerRowIndex) { selector += `[data-inner-row='${endInnerRowIndex}']` }
      const endTd = this.table.querySelector(selector);
      if(!endTd){
        //debugger;
        return;
      }
      const {
        offsetTop: endOffsetTop,
        offsetLeft: endOffsetLeft,
        offsetWidth: endOffsetWidth,
        offsetHeight: endOffsetHeight
      } = this.getOffset(endTd);
      multiSelectOffsetTop = Math.min(offsetTop, endOffsetTop);
      multiSelectOffsetLeft = Math.min(offsetLeft, endOffsetLeft);
      multiSelectOffsetWidth = offsetLeft >= endOffsetLeft ? offsetLeft - endOffsetLeft + offsetWidth
        : endOffsetLeft - offsetLeft + endOffsetWidth;
      multiSelectOffsetHeight = offsetTop >= endOffsetTop ? offsetTop - endOffsetTop + offsetHeight
        : endOffsetTop - offsetTop + endOffsetHeight;

      const areaBorders = document.querySelectorAll('.sou-area-borders > div');
      areaBorders[0].setAttribute('style', `top: ${multiSelectOffsetTop}px; left: ${multiSelectOffsetLeft}px; width: ${multiSelectOffsetWidth}px; height: 1px;`);
      areaBorders[1].setAttribute('style', `top: ${multiSelectOffsetTop}px; left: ${multiSelectOffsetLeft + multiSelectOffsetWidth}px; width: 1px; height: ${multiSelectOffsetHeight}px;`);
      areaBorders[2].setAttribute('style', `top: ${multiSelectOffsetTop + multiSelectOffsetHeight}px; left: ${multiSelectOffsetLeft}px; width: ${multiSelectOffsetWidth}px; height: 1px;`);
      areaBorders[3].setAttribute('style', `top: ${multiSelectOffsetTop}px; left: ${multiSelectOffsetLeft}px; width: 1px; height: ${multiSelectOffsetHeight}px;`);
      areaBorders[4].setAttribute('style', `display: ${this.state.isTyping ? 'none' : 'initial'}; top: ${multiSelectOffsetTop + multiSelectOffsetHeight - 4}px; left: ${multiSelectOffsetLeft + multiSelectOffsetWidth - 4}px;`);
    } else {
      currentBorders[4].setAttribute('style', `display: ${this.state.isTyping ? 'none' : 'initial'}; top: ${offsetTop + offsetHeight - 4}px; left: ${offsetLeft + offsetWidth - 4}px;`);
    }

    if (dragColIndex !== undefined) {
      const dragTd = this.table.querySelector(`[data-col='${dragColIndex}'][data-row='${dragRowIndex}']`);
      const dragOffsetTop = dragTd.offsetTop;
      const dragOffsetLeft = dragTd.offsetLeft;
      const dragOffsetWidth = dragTd.offsetWidth;
      const dragOffsetHeight = dragTd.offsetHeight;
      if (endColIndex === undefined) {
        if (dragRowIndex === rowIndex) {
          if (dragColIndex > colIndex) {
            // drag right
            autoPasteOffsetTop = offsetTop;
            autoPasteOffsetLeft = offsetLeft + offsetWidth;
            autoPasteOffsetWidth = dragOffsetLeft + dragOffsetWidth - autoPasteOffsetLeft;
            autoPasteOffsetHeight = offsetHeight;
          } else {
            // drag left
            autoPasteOffsetTop = offsetTop;
            autoPasteOffsetLeft = dragOffsetLeft;
            autoPasteOffsetWidth = offsetLeft - dragOffsetLeft;
            autoPasteOffsetHeight = offsetHeight;
          }
        } else {
          if (dragRowIndex < rowIndex) {
            // drag up
            autoPasteOffsetTop = dragOffsetTop;
            autoPasteOffsetLeft = offsetLeft;
            autoPasteOffsetWidth = offsetWidth;
            autoPasteOffsetHeight = offsetTop - dragOffsetTop;
          } else {
            // drag down
            autoPasteOffsetTop = offsetTop + offsetHeight;
            autoPasteOffsetLeft = offsetLeft;
            autoPasteOffsetWidth = offsetWidth;
            autoPasteOffsetHeight = dragOffsetTop + dragOffsetHeight - autoPasteOffsetTop;
          }
        }
      } else {
        if (dragRowIndex <= Math.max(rowIndex, endRowIndex) && dragRowIndex >= Math.min(rowIndex, endRowIndex)) {
          if (dragColIndex > Math.max(colIndex, endColIndex)) {
            // drag right
            autoPasteOffsetTop = multiSelectOffsetTop;
            autoPasteOffsetLeft = multiSelectOffsetLeft + multiSelectOffsetWidth;
            autoPasteOffsetWidth = dragOffsetLeft + dragOffsetWidth - autoPasteOffsetLeft;
            autoPasteOffsetHeight = multiSelectOffsetHeight;
          } else {
            // drag left
            autoPasteOffsetTop = multiSelectOffsetTop;
            autoPasteOffsetLeft = dragOffsetLeft;
            autoPasteOffsetWidth = multiSelectOffsetLeft - dragOffsetLeft;
            autoPasteOffsetHeight = multiSelectOffsetHeight;
          }
        } else {
          if (dragRowIndex < Math.min(rowIndex, endRowIndex)) {
            // drag up
            autoPasteOffsetTop = dragOffsetTop;
            autoPasteOffsetLeft = multiSelectOffsetLeft;
            autoPasteOffsetWidth = multiSelectOffsetWidth;
            autoPasteOffsetHeight = multiSelectOffsetTop - dragOffsetTop;
          } else {
            // drag down
            autoPasteOffsetTop = multiSelectOffsetTop + multiSelectOffsetHeight;
            autoPasteOffsetLeft = multiSelectOffsetLeft;
            autoPasteOffsetWidth = multiSelectOffsetWidth;
            autoPasteOffsetHeight = dragOffsetTop + dragOffsetHeight - autoPasteOffsetTop;
          }
        }
      }

      const pasteBorders = document.querySelectorAll('.sou-paste-borders > div');
      pasteBorders[0].setAttribute('style', `top: ${autoPasteOffsetTop}px; left: ${autoPasteOffsetLeft}px; width: ${autoPasteOffsetWidth}px; height: 1px;`);
      pasteBorders[1].setAttribute('style', `top: ${autoPasteOffsetTop}px; left: ${autoPasteOffsetLeft + autoPasteOffsetWidth}px; width: 1px; height: ${autoPasteOffsetHeight}px;`);
      pasteBorders[2].setAttribute('style', `top: ${autoPasteOffsetTop + autoPasteOffsetHeight}px; left: ${autoPasteOffsetLeft}px; width: ${autoPasteOffsetWidth}px; height: 1px;`);
      pasteBorders[3].setAttribute('style', `top: ${autoPasteOffsetTop}px; left: ${autoPasteOffsetLeft}px; width: 1px; height: ${autoPasteOffsetHeight}px;`);
    }
  }

  getOffset(td) {
    const table = document.querySelector('.inner-wrapper');
    const tableRect = table.getBoundingClientRect();
    const tdRect = td.getBoundingClientRect();
    return {
      offsetTop: tdRect.top - tableRect.top,
      offsetLeft: tdRect.left - tableRect.left,
      offsetHeight: td.offsetHeight,
      offsetWidth: td.offsetWidth
    }
  }
  createHeader(headers, i, headerRows, parHeader, leafs) {
    let parent = parHeader;
    while (parent) {
      parent.rowSplit++;
      parent.colSpan += headers.length - 1;
      parent = parent.parHeader;
    }

    for (let header of headers) {
      header.parHeader = parHeader;
      header.rowSplit = 1;
      header.colSpan = 1;
      if (!headerRows[i]) {
        headerRows[i] = [];
      }
      headerRows[i].push(header);
      if (header.sub) {
        this.createHeader(header.sub, i + 1, headerRows, header, leafs);
      } else {
        leafs.push(header);
      }
    }
  }

  getLeafs(header) {
    const {headerLeafs} = this.state;
    let leafs = []
    for (let leaf of headerLeafs) {
      let parent = leaf;
      while (parent) {
        if (parent.index === header.index || header.index === leaf.index) {
          leafs.push(leaf);
          break;
        }
        parent = parent.parHeader;
      }
    }
    return leafs;
  }
  renderContext() {
    return (
      <ul
        style={{
          top: this.state.yPos + 'px',
          left: this.state.xPos + 'px',
          display: this.state.isContextMenuHidden ? 'none' : 'block',
        }}
        className="sou-context"
        onClick={() => {
          this.hideContextMenu();
          this.input.select();
        } }
        onContextMenu={e => e.preventDefault()}
        >
        <li
          key="1"
          onClick={this.copy}
          >
          <span>复制</span>
        </li>

        <li
          key="2"
          onClick={this.cut}
          >
          <span>剪切</span>
        </li>

        <li
          key="3"
          onClick={this.paste}
          >
          <span>黏贴</span>
        </li>

        <div key="d1" className="divider" />

        <li
          key="4"
          onClick={this.insertRow(0)}
          >
          <span>在上方插入行</span>
        </li>

        <li
          key="5"
          onClick={this.insertRow(1)}
          >
          <span>在下方插入行</span>
        </li>

        <li
          key="6"
          onClick={this.deleteRow}
          >
          <span>删除行</span>
        </li>

        <div key="d2" className="divider" />

        <li
          key="7"
          onClick={this.insertCol(0)}
          >
          <span>在左边插入列</span>
        </li>

        <li
          key="8"
          onClick={this.insertCol(1)}
          >
          <span>在左边插入列</span>
        </li>

        <li
          key="9"
          onClick={this.deleteCol}
          >
          <span>删除列</span>
        </li>

        <div key="d3" className="divider" />

        <li
          key="10"
          onClick={this.clearCells}
          >
          <span>清空</span>
        </li>

        <div key="d4" className="divider" />

        <li
          key="11"
          onClick={this.sort()}
          >
          <span>按A-Z排序</span>
        </li>

        <li
          key="12"
          onClick={this.sort(true)}
          >
          <span>按Z-A排序</span>
        </li>
      </ul>
    );
  }

undoTableData(){
  const {tableData} = this.state;
    if(tableData.past.length==0){
      return;
    }
  const previous = tableData.past[tableData.past.length-1];
  const newPast = tableData.past.slice(0,tableData.past.length-1);
  this.setState({
    tableData: {
    past:newPast,
    present:previous,
    future:[tableData.present,...tableData.future]
  }
})
}

redoTableData(){
  const {tableData} = this.state;
  if(tableData.future.length==0){
      return;
    }
  const next = tableData.future[0];
  const newFuture = tableData.future.slice(1);
  this.setState({
    tableData:{
    past:[...tableData.past,tableData.present],
    present:next,
    future:newFuture
  }
  })
}
  render() {
    const { width, height } = this.props;
    return (
      <div>
      <a className='a-btn' onClick={this.undoTableData}>undo</a>
      <a className='a-btn' onClick={this.redoTableData}>redo</a>
      <div
        className="sou-table-wrapper"
        style={{
          width: width === undefined ? 'auto' : width + 'px',
          height: height === undefined ? 'auto' : height + 'px',
        }}
        ref={wrapper => this.wrapper = wrapper}
        >

        {this.renderTable()}
        {this.renderContext()}
      </div>
      </div>
    );
  }
}

SouTable.defaultProps = {
  tableData: [
    ['我人有的和助产不为这工以上是民同计算的看风景道济到底觉得觉得', 'Beijing', 'Shanghai', 'Guangzhou', 'bingA'],
    ['Temperature', '5', '22', '29'],
    ['Weather', 'Windy', 'Sunny', 'Rainy'],
    [], [], [], [],
    [[['a', 'b', 'c', 'd'], ['b', 'c', 'e', 'c'], ['你好', 'ndksjsd', 'ccccc', '']], [['b', 'c', 'e', 'c'], ['你好', 'ndksjsd', 'ccccc', 'efasdfssssssssssssssssssasdf']]]
  ],
  minTableCol: 10,
  minTableRow: 21,
  minCellWidth: 50,
  cellHeight: 28,
  getData: (data) => {
    console.log(data)
  },
};

SouTable.propTypes = {
  tableData: PropTypes.array,
  tableHeaders: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  minTableCol: PropTypes.number,
  minTableRow: PropTypes.number,
  minCellWidth: PropTypes.number,
  cellHeight: PropTypes.number,
  getData: PropTypes.func,
};

export default SouTable;

import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';

interface DesktopAdminTableProps {
  columns: ColumnsType<any>;
  dataSource: any[];
  rowKey: string;
  loading?: boolean;
  size?: TableProps<any>['size'];
  scroll?: TableProps<any>['scroll'];
  pagination?: TableProps<any>['pagination'];
}

export default function DesktopAdminTable({
  columns,
  dataSource,
  rowKey,
  loading = false,
  size = 'middle',
  scroll,
  pagination = false,
}: DesktopAdminTableProps) {
  return (
    <div className="admin-table-wrap">
      <Table
        className="admin-data-table"
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        size={size}
        scroll={scroll}
        pagination={pagination}
      />
    </div>
  );
}

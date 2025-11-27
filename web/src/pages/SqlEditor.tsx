import { useState } from 'react';
import { Card, Select, Button, Table, message, Space, Tabs } from 'antd';
import { PlayCircleOutlined, SaveOutlined, FileTextOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { useQuery, useMutation } from 'react-query';
import { dataSourceApi } from '../api/datasource';

export default function SqlEditor() {
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 10;');
  const [result, setResult] = useState<any>(null);
  const [tables, setTables] = useState<string[]>([]);

  const { data: dataSources } = useQuery('datasources', () =>
    dataSourceApi.list({ pageSize: 100 })
  );

  const executeMutation = useMutation(
    ({ id, sql }: { id: string; sql: string }) =>
      dataSourceApi.executeQuery(id, sql),
    {
      onSuccess: (data: any) => {
        setResult(data.data);
        message.success(`查询成功！返回 ${data.data.rowCount} 行数据`);
      },
      onError: () => {
        message.error('查询执行失败');
      },
    }
  );

  const tablesMutation = useMutation(dataSourceApi.getTables, {
    onSuccess: (data: any) => {
      setTables(data.data);
    },
  });

  const handleDataSourceChange = (value: string) => {
    setSelectedDataSource(value);
    tablesMutation.mutate(value);
  };

  const handleExecute = () => {
    if (!selectedDataSource) {
      message.warning('请先选择数据源');
      return;
    }
    if (!sql.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }
    executeMutation.mutate({ id: selectedDataSource, sql });
  };

  const columns = result?.fields?.map((field: any) => ({
    title: field.name,
    dataIndex: field.name,
    key: field.name,
  })) || [];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>SQL 编辑器</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', marginBottom: 16 }}>
          <span>数据源:</span>
          <Select
            style={{ width: 300 }}
            placeholder="请选择数据源"
            value={selectedDataSource}
            onChange={handleDataSourceChange}
            options={dataSources?.data?.map((ds: any) => ({
              label: `${ds.name} (${ds.type})`,
              value: ds.id,
            }))}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            loading={executeMutation.isLoading}
          >
            执行 (Ctrl+Enter)
          </Button>
          <Button icon={<SaveOutlined />}>
            保存
          </Button>
          <Button icon={<FileTextOutlined />}>
            格式化
          </Button>
        </Space>

        <Editor
          height="300px"
          language="sql"
          theme="vs-dark"
          value={sql}
          onChange={(value) => setSql(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </Card>

      {selectedDataSource && (
        <Card title="数据库表" style={{ marginBottom: 16 }}>
          <Space wrap>
            {tables.map((table) => (
              <Button
                key={table}
                size="small"
                onClick={() => setSql(`SELECT * FROM ${table} LIMIT 10;`)}
              >
                {table}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {result && (
        <Card
          title={
            <div>
              <span>查询结果</span>
              <span style={{ marginLeft: 16, fontSize: 14, color: '#999' }}>
                {result.rowCount} 行，耗时 {result.executionTime}ms
              </span>
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={result.rows}
            rowKey={(_, index) => index}
            scroll={{ x: true }}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      )}
    </div>
  );
}

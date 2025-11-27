import { useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Button } from 'antd';
import { useQuery } from 'react-query';
import { apiApi } from '../api/api';
import { Line } from '@ant-design/charts';

export default function ApiDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: api } = useQuery(['api', id], () => apiApi.get(id!));
  const { data: metrics } = useQuery(['api-metrics', id], () =>
    apiApi.getMetrics(id!, 7)
  );
  const { data: logs } = useQuery(['api-logs', id], () =>
    apiApi.getLogs(id!, { page: 1, pageSize: 20 })
  );

  const metricsData = metrics?.data?.metrics?.map((m: any) => ({
    date: m.date,
    value: m.totalRequests,
  })) || [];

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      render: (code: number) => {
        const color = code < 400 ? 'green' : 'red';
        return <Tag color={color}>{code}</Tag>;
      },
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => `${time}ms`,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>API 详情</h2>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="名称">{api?.data?.name}</Descriptions.Item>
          <Descriptions.Item label="路径">
            /{api?.data?.version}{api?.data?.path}
          </Descriptions.Item>
          <Descriptions.Item label="方法">
            <Tag color="blue">{api?.data?.method}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={api?.data?.status === 'PUBLISHED' ? 'green' : 'orange'}>
              {api?.data?.status === 'PUBLISHED' ? '已发布' : '草稿'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="缓存">
            {api?.data?.cacheEnabled ? '已启用' : '未启用'}
          </Descriptions.Item>
          <Descriptions.Item label="限流">
            {api?.data?.rateLimitEnabled
              ? `${api?.data?.rateLimit} 次/分钟`
              : '未启用'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(api?.data?.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(api?.data?.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="SQL 查询" style={{ marginBottom: 16 }}>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
          {api?.data?.sql}
        </pre>
      </Card>

      <Tabs
        items={[
          {
            key: 'metrics',
            label: '性能指标',
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <span>总请求: {metrics?.data?.summary?.totalRequests || 0}</span>
                  <span style={{ marginLeft: 24 }}>
                    错误数: {metrics?.data?.summary?.totalErrors || 0}
                  </span>
                  <span style={{ marginLeft: 24 }}>
                    错误率:{' '}
                    {metrics?.data?.summary?.errorRate?.toFixed(2) || 0}%
                  </span>
                </div>
                <Line
                  data={metricsData}
                  xField="date"
                  yField="value"
                  height={300}
                  smooth
                />
              </Card>
            ),
          },
          {
            key: 'logs',
            label: '调用日志',
            children: (
              <Table
                columns={logColumns}
                dataSource={logs?.data || []}
                rowKey="id"
                pagination={{
                  total: logs?.pagination?.total,
                  pageSize: logs?.pagination?.pageSize,
                  current: logs?.pagination?.page,
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

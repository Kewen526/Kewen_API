import { Card, Row, Col, Statistic, Table } from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { dataSourceApi } from '../api/datasource';
import { apiApi } from '../api/api';

export default function Dashboard() {
  const { data: dataSources } = useQuery('datasources', () =>
    dataSourceApi.list({ pageSize: 100 })
  );

  const { data: apis } = useQuery('apis', () =>
    apiApi.list({ pageSize: 100 })
  );

  const activeDataSources =
    dataSources?.data?.filter((ds: any) => ds.status === 'ACTIVE').length || 0;
  const publishedApis =
    apis?.data?.filter((api: any) => api.status === 'PUBLISHED').length || 0;
  const draftApis =
    apis?.data?.filter((api: any) => api.status === 'DRAFT').length || 0;

  const recentApis = apis?.data?.slice(0, 5) || [];

  const columns = [
    {
      title: 'API 名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <span style={{ color: getMethodColor(method) }}>{method}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表板</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据源总数"
              value={dataSources?.pagination?.total || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃数据源"
              value={activeDataSources}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布 API"
              value={publishedApis}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿 API"
              value={draftApis}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近创建的 API">
        <Table
          columns={columns}
          dataSource={recentApis}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}

function getMethodColor(method: string) {
  const colors: any = {
    GET: '#1890ff',
    POST: '#52c41a',
    PUT: '#faad14',
    DELETE: '#ff4d4f',
    PATCH: '#722ed1',
  };
  return colors[method] || '#000';
}

function getStatusTag(status: string) {
  const statusMap: any = {
    PUBLISHED: { text: '已发布', color: 'green' },
    DRAFT: { text: '草稿', color: 'orange' },
    DEPRECATED: { text: '已废弃', color: 'red' },
    ARCHIVED: { text: '已归档', color: 'gray' },
  };
  const item = statusMap[status] || { text: status, color: 'default' };
  return <span style={{ color: item.color }}>{item.text}</span>;
}

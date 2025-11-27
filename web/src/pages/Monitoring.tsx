import { Card, Row, Col, Statistic, Table } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';

export default function Monitoring() {
  const apiData = [
    { type: 'GET', value: 3487 },
    { type: 'POST', value: 1234 },
    { type: 'PUT', value: 567 },
    { type: 'DELETE', value: 234 },
  ];

  const requestData = [
    { time: '00:00', count: 120 },
    { time: '04:00', count: 80 },
    { time: '08:00', count: 450 },
    { time: '12:00', count: 780 },
    { time: '16:00', count: 650 },
    { time: '20:00', count: 320 },
  ];

  const topApis = [
    {
      key: '1',
      name: '获取用户列表',
      path: '/v1/users',
      requests: 12340,
      avgTime: 45,
    },
    {
      key: '2',
      name: '用户详情',
      path: '/v1/users/:id',
      requests: 8760,
      avgTime: 32,
    },
    {
      key: '3',
      name: '创建订单',
      path: '/v1/orders',
      requests: 5432,
      avgTime: 156,
    },
  ];

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
      title: '请求次数',
      dataIndex: 'requests',
      key: 'requests',
      sorter: (a: any, b: any) => a.requests - b.requests,
    },
    {
      title: '平均响应时间',
      dataIndex: 'avgTime',
      key: 'avgTime',
      render: (time: number) => `${time}ms`,
      sorter: (a: any, b: any) => a.avgTime - b.avgTime,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>监控中心</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日总请求"
              value={25522}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={68}
              suffix="ms"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功率"
              value={99.8}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误数"
              value={51}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="请求趋势">
            <Column
              data={requestData}
              xField="time"
              yField="count"
              height={300}
              label={{
                position: 'top',
                style: {
                  fill: '#000000',
                },
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="请求方法分布">
            <Pie
              data={apiData}
              angleField="value"
              colorField="type"
              radius={0.8}
              height={300}
              label={{
                type: 'outer',
                content: '{name} {percentage}',
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="热门 API Top 10">
        <Table
          columns={columns}
          dataSource={topApis}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

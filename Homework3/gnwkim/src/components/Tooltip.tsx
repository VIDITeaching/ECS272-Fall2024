const Tooltip = ({ id }: {id: string}) => {
  return (
    <div id={id}
      style={{
        position: 'absolute',
        display: 'none',
        pointerEvents: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '5px',
        borderRadius: '3px',
        fontSize: '0.8rem'
      }}
    />
  )
}

export default Tooltip;